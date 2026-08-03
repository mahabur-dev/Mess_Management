import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  BillingCalculationStatus,
  MonthlyBillingState,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { billingMonthStart } from './billing-period';
import { MonthlyBillService } from './monthly-bill.service';

export type BillingSyncStatus =
  'SYNCED' | 'RECALCULATION_QUEUED' | 'RECALCULATION_REQUIRED';

const WORKER_INTERVAL_MS = 1_000;
const WORKER_BATCH_SIZE = 12;
const WORKER_CONCURRENCY = 4;
const STALE_JOB_MS = 5 * 60 * 1_000;
const MAX_ATTEMPTS = 5;
const CONNECTION_RETRY_MS = 30_000;

@Injectable()
export class MonthlyBillReconciliationService {
  private readonly logger = new Logger(MonthlyBillReconciliationService.name);
  private workerRunning = false;
  private nextWorkerAttemptAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlyBillService: MonthlyBillService,
  ) {}

  async reconcile(
    messId: string,
    ...effectiveDates: Array<Date | null | undefined>
  ): Promise<BillingSyncStatus> {
    const months = new Map<number, Date>();
    for (const date of effectiveDates) {
      if (!date || Number.isNaN(date.getTime())) continue;
      const month = billingMonthStart(date);
      months.set(month.getTime(), month);
    }
    if (!months.size) return 'SYNCED';

    try {
      await this.queueMonths(messId, [...months.values()]);
      return 'RECALCULATION_QUEUED';
    } catch (error) {
      this.logger.error(
        `Failed to queue monthly billing for mess ${messId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return 'RECALCULATION_REQUIRED';
    }
  }

  async ensureScheduled(messId: string, monthInput: string | Date) {
    const month = billingMonthStart(monthInput);
    const existing = await this.prisma.monthlyBillingState.findUnique({
      where: { mess_id_month: { mess_id: messId, month } },
    });
    if (existing) return existing;

    await this.queueMonths(messId, [month]);
    return this.prisma.monthlyBillingState.findUnique({
      where: { mess_id_month: { mess_id: messId, month } },
    });
  }

  async getState(messId: string, monthInput: string | Date) {
    const month = billingMonthStart(monthInput);
    return this.prisma.monthlyBillingState.findUnique({
      where: { mess_id_month: { mess_id: messId, month } },
      select: {
        status: true,
        revision: true,
        requested_at: true,
        calculated_at: true,
        last_error: true,
      },
    });
  }

  private async queueMonths(messId: string, months: Date[]) {
    const now = new Date();
    await this.prisma.$transaction(
      months.map((month) =>
        this.prisma.$executeRaw(Prisma.sql`
          INSERT INTO "monthly_billing_states" (
            "mess_id", "month", "status", "requested_at", "next_attempt_at"
          ) VALUES (
            ${messId}::uuid,
            ${month},
            'DIRTY'::"BillingCalculationStatus",
            ${now},
            ${now}
          )
          ON CONFLICT ("mess_id", "month") DO UPDATE SET
            "status" = CASE
              WHEN "monthly_billing_states"."status" = 'PROCESSING'
                THEN 'PROCESSING'::"BillingCalculationStatus"
              ELSE 'DIRTY'::"BillingCalculationStatus"
            END,
            "revision" = "monthly_billing_states"."revision" + 1,
            "attempts" = CASE
              WHEN "monthly_billing_states"."status" = 'PROCESSING'
                THEN "monthly_billing_states"."attempts"
              ELSE 0
            END,
            "requested_at" = ${now},
            "started_at" = CASE
              WHEN "monthly_billing_states"."status" = 'PROCESSING'
                THEN "monthly_billing_states"."started_at"
              ELSE NULL
            END,
            "calculated_at" = NULL,
            "next_attempt_at" = ${now},
            "last_error" = NULL
        `),
      ),
    );
  }

  @Interval(WORKER_INTERVAL_MS)
  async processQueuedBilling() {
    if (Date.now() < this.nextWorkerAttemptAt) return;
    if (this.workerRunning) return;
    this.workerRunning = true;

    try {
      const staleBefore = new Date(Date.now() - STALE_JOB_MS);
      await this.prisma.monthlyBillingState.updateMany({
        where: {
          status: BillingCalculationStatus.PROCESSING,
          started_at: { lt: staleBefore },
        },
        data: {
          status: BillingCalculationStatus.DIRTY,
          revision: { increment: 1 },
          started_at: null,
          next_attempt_at: new Date(),
          last_error: 'Recovered an abandoned billing job',
        },
      });

      const candidates = await this.prisma.$queryRaw<MonthlyBillingState[]>(
        Prisma.sql`
          SELECT candidate.*
          FROM (
            SELECT DISTINCT ON ("mess_id") *
            FROM "monthly_billing_states"
            WHERE "status" = 'DIRTY'
              AND "next_attempt_at" <= NOW()
            ORDER BY "mess_id", "month" ASC
          ) AS candidate
          ORDER BY candidate."requested_at" ASC
          LIMIT ${WORKER_BATCH_SIZE}
        `,
      );

      const claimed: typeof candidates = [];
      for (const candidate of candidates) {
        if (claimed.some((job) => job.mess_id === candidate.mess_id)) continue;
        try {
          const result = await this.prisma.monthlyBillingState.updateMany({
            where: {
              id: candidate.id,
              revision: candidate.revision,
              status: BillingCalculationStatus.DIRTY,
            },
            data: {
              status: BillingCalculationStatus.PROCESSING,
              attempts: { increment: 1 },
              started_at: new Date(),
              last_error: null,
            },
          });
          if (result.count) claimed.push(candidate);
        } catch (error) {
          if (!(
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          )) {
            throw error;
          }
        }
      }

      for (let index = 0; index < claimed.length; index += WORKER_CONCURRENCY) {
        await Promise.all(
          claimed
            .slice(index, index + WORKER_CONCURRENCY)
            .map((job) => this.processJob(job)),
        );
      }
    } catch (error) {
      if (this.isDatabaseConnectionError(error)) {
        this.nextWorkerAttemptAt = Date.now() + CONNECTION_RETRY_MS;
        this.logger.warn(
          `Monthly billing worker paused for ${CONNECTION_RETRY_MS / 1000}s: database is not reachable`,
        );
        return;
      }

      this.logger.error(
        'Monthly billing worker failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.workerRunning = false;
    }
  }

  private async processJob(job: {
    id: string;
    mess_id: string;
    month: Date;
    revision: number;
    attempts: number;
  }) {
    try {
      await this.monthlyBillService.recalculateMonthlyBills(
        job.mess_id,
        job.month,
      );

      const completed = await this.prisma.monthlyBillingState.updateMany({
        where: {
          id: job.id,
          revision: job.revision,
          status: BillingCalculationStatus.PROCESSING,
        },
        data: {
          status: BillingCalculationStatus.READY,
          calculated_at: new Date(),
          started_at: null,
          next_attempt_at: new Date(),
          last_error: null,
        },
      });

      if (!completed.count) {
        await this.releaseSupersededJob(job.id, job.revision);
        return;
      }

      const nextBill = await this.prisma.monthlyBill.findFirst({
        where: { mess_id: job.mess_id, month: { gt: job.month } },
        orderBy: { month: 'asc' },
        select: { month: true },
      });
      if (nextBill) await this.queueMonths(job.mess_id, [nextBill.month]);
    } catch (error) {
      const attempts = job.attempts + 1;
      const failed = attempts >= MAX_ATTEMPTS;
      const retryDelayMs = Math.min(2 ** attempts * 1_000, 60_000);
      const failedUpdate = await this.prisma.monthlyBillingState.updateMany({
        where: {
          id: job.id,
          revision: job.revision,
          status: BillingCalculationStatus.PROCESSING,
        },
        data: {
          status: failed
            ? BillingCalculationStatus.FAILED
            : BillingCalculationStatus.DIRTY,
          started_at: null,
          next_attempt_at: new Date(Date.now() + retryDelayMs),
          last_error: String(
            error instanceof Error ? error.message : error,
          ).slice(0, 1000),
        },
      });
      if (!failedUpdate.count) {
        await this.releaseSupersededJob(job.id, job.revision);
      }
      this.logger.error(
        `Monthly billing failed for mess ${job.mess_id}, month ${job.month.toISOString()}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async releaseSupersededJob(id: string, revision: number) {
    await this.prisma.monthlyBillingState.updateMany({
      where: {
        id,
        status: BillingCalculationStatus.PROCESSING,
        revision: { gt: revision },
      },
      data: {
        status: BillingCalculationStatus.DIRTY,
        started_at: null,
        next_attempt_at: new Date(),
      },
    });
  }

  private isDatabaseConnectionError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P1001'
    ) {
      return true;
    }

    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes("Can't reach database server") ||
      message.includes('DatabaseNotReachable')
    );
  }
}
