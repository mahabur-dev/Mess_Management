import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  MonthlyReportDeliveryStatus,
  MonthlyReportStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import config from 'src/app/config';
import sendMailer from 'src/app/helpers/sendMailer';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonthlyBillService } from '../monthly-bill/monthly-bill.service';
import {
  billingMonthRange,
  currentDhakaMonth,
} from '../monthly-bill/billing-period';
import { NotificationService } from '../notification/notification.service';
import { GenerateMonthlyReportDto } from './dto/monthly-report.dto';
import { MonthlyReportPdfService } from './monthly-report-pdf.service';
import {
  isMonthlyReportSnapshot,
  MonthlyReportMemberSnapshot,
  MonthlyReportSnapshot,
} from './monthly-report.types';

type ReportLocale = 'en' | 'bn';
type ReportAccess = { canManage: boolean; isMember: boolean };

const REPORT_TIME_ZONE = 'Asia/Dhaka';
const AUTO_GENERATE_CRON = '0 9 * * *';
const DELIVERY_CRON = '*/10 * * * *';
const MAX_DELIVERY_ATTEMPTS = 5;

const MONTHLY_REPORT_INCLUDE = {
  mess: { select: { id: true, name: true } },
  generator: { select: { id: true, name: true } },
  finalizer: { select: { id: true, name: true } },
  deliveries: {
    orderBy: { created_at: 'asc' as const },
    select: {
      id: true,
      member_id: true,
      recipient_email: true,
      status: true,
      attempts: true,
      sent_at: true,
      last_error: true,
    },
  },
} as const;

type MonthlyReportRecord = Prisma.MonthlyReportGetPayload<{
  include: typeof MONTHLY_REPORT_INCLUDE;
}>;

function fixed(value: unknown) {
  return Number(Number(value ?? 0).toFixed(2));
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

@Injectable()
export class MonthlyReportService {
  private readonly logger = new Logger(MonthlyReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlyBillService: MonthlyBillService,
    private readonly notificationService: NotificationService,
    private readonly pdfService: MonthlyReportPdfService,
  ) {}

  async getSettings(messId: string, userId: string, role: string) {
    await this.verifyAccess(messId, userId, role, true);
    const settings = await this.prisma.monthlyReportSetting.findUnique({
      where: { mess_id: messId },
      select: { auto_generate: true, email_members: true, updated_at: true },
    });
    return (
      settings ?? {
        auto_generate: true,
        email_members: false,
        updated_at: null,
      }
    );
  }

  async updateSettings(
    messId: string,
    userId: string,
    role: string,
    input: { autoGenerate?: boolean; emailMembers?: boolean },
  ) {
    await this.verifyAccess(messId, userId, role, true);
    const current = await this.prisma.monthlyReportSetting.findUnique({
      where: { mess_id: messId },
    });
    return this.prisma.monthlyReportSetting.upsert({
      where: { mess_id: messId },
      create: {
        mess_id: messId,
        auto_generate: input.autoGenerate ?? true,
        email_members: input.emailMembers ?? false,
      },
      update: {
        auto_generate: input.autoGenerate ?? current?.auto_generate ?? true,
        email_members: input.emailMembers ?? current?.email_members ?? false,
      },
      select: { auto_generate: true, email_members: true, updated_at: true },
    });
  }

  async findForMess(
    messId: string,
    monthInput: string,
    userId: string,
    role: string,
  ) {
    const access = await this.verifyAccess(messId, userId, role);
    const month = this.completedMonth(monthInput);
    const report = await this.prisma.monthlyReport.findUnique({
      where: { mess_id_month: { mess_id: messId, month } },
      include: MONTHLY_REPORT_INCLUDE,
    });
    if (
      report &&
      !access.canManage &&
      report.status !== MonthlyReportStatus.FINALIZED
    ) {
      return null;
    }
    return report ? this.presentReport(report, userId, access) : null;
  }

  async findOne(reportId: string, userId: string, role: string) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id: reportId },
      include: MONTHLY_REPORT_INCLUDE,
    });
    if (!report) throw new HttpException('Monthly report not found', 404);
    const access = await this.verifyAccess(report.mess_id, userId, role);
    if (!access.canManage && report.status !== MonthlyReportStatus.FINALIZED) {
      throw new HttpException('Monthly report not found', 404);
    }
    return this.presentReport(report, userId, access);
  }

  async generate(
    actorId: string,
    role: string,
    dto: GenerateMonthlyReportDto,
  ) {
    const month = this.completedMonth(dto.month);
    await this.verifyAccess(dto.messId, actorId, role, true);

    // Reuse the existing billing implementation without changing its formula.
    const bills = await this.monthlyBillService.generate(actorId, role, {
      messId: dto.messId,
      month: month.toISOString(),
    });
    const snapshot = await this.buildSnapshot(dto.messId, month, bills);
    const source = await this.prisma.monthlyBillingState.findUnique({
      where: { mess_id_month: { mess_id: dto.messId, month } },
      select: { revision: true },
    });
    const report = await this.persistDraft(
      dto.messId,
      month,
      snapshot,
      source?.revision ?? 0,
      actorId,
    );
    return this.findOne(report.id, actorId, role);
  }

  async finalize(reportId: string, actorId: string, role: string) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id: reportId },
      include: MONTHLY_REPORT_INCLUDE,
    });
    if (!report) throw new HttpException('Monthly report not found', 404);
    await this.verifyAccess(report.mess_id, actorId, role, true);
    if (report.status === MonthlyReportStatus.FINALIZED) {
      await this.completeFinalizationSideEffects(report, actorId);
      return this.findOne(reportId, actorId, role);
    }

    const [latestBill, billingState] = await Promise.all([
      this.prisma.monthlyBill.aggregate({
        where: { mess_id: report.mess_id, month: report.month },
        _max: { generated_at: true },
      }),
      this.prisma.monthlyBillingState.findUnique({
        where: {
          mess_id_month: { mess_id: report.mess_id, month: report.month },
        },
        select: { revision: true },
      }),
    ]);
    if (
      (latestBill._max.generated_at &&
        latestBill._max.generated_at.getTime() > report.generated_at.getTime()) ||
      (billingState && billingState.revision !== report.source_revision)
    ) {
      throw new HttpException(
        'The monthly calculation changed after this draft was generated. Regenerate the report before finalizing.',
        409,
      );
    }

    const finalized = await this.prisma.monthlyReport.updateMany({
      where: {
        id: reportId,
        status: MonthlyReportStatus.DRAFT,
        version: report.version,
        source_revision: report.source_revision,
      },
      data: {
        status: MonthlyReportStatus.FINALIZED,
        finalized_by: actorId,
        finalized_at: new Date(),
      },
    });
    if (finalized.count !== 1) {
      throw new HttpException('Monthly report has already been finalized', 409);
    }

    const finalizedReport = await this.prisma.monthlyReport.findUniqueOrThrow({
      where: { id: reportId },
      include: MONTHLY_REPORT_INCLUDE,
    });
    await this.completeFinalizationSideEffects(finalizedReport, actorId);
    return this.findOne(reportId, actorId, role);
  }

  async renderPdf(
    reportId: string,
    userId: string,
    role: string,
    requestedLocale?: string,
  ) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id: reportId },
      select: {
        mess_id: true,
        month: true,
        status: true,
        snapshot: true,
      },
    });
    if (!report) throw new HttpException('Monthly report not found', 404);
    if (report.status !== MonthlyReportStatus.FINALIZED) {
      throw new HttpException('Finalize the report before downloading PDF', 409);
    }
    const access = await this.verifyAccess(report.mess_id, userId, role);
    const snapshot = this.readSnapshot(report.snapshot);
    const personalMember = access.canManage
      ? undefined
      : snapshot.members.find((member) => member.memberId === userId);
    if (!access.canManage && !personalMember) {
      throw new HttpException('Your report summary is not available', 403);
    }
    const locale: ReportLocale = requestedLocale === 'bn' ? 'bn' : 'en';
    const buffer = await this.pdfService.render(snapshot, locale, personalMember);
    const month = snapshot.month.slice(0, 7);
    const scope = personalMember ? 'personal' : 'full';
    return {
      buffer,
      filename: 'messzen-' + month + '-' + scope + '-report.pdf',
    };
  }

  async retryDeliveries(reportId: string, actorId: string, role: string) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id: reportId },
      select: { mess_id: true, status: true },
    });
    if (!report) throw new HttpException('Monthly report not found', 404);
    await this.verifyAccess(report.mess_id, actorId, role, true);
    if (report.status !== MonthlyReportStatus.FINALIZED) {
      throw new HttpException('Only finalized report deliveries can be retried', 409);
    }
    await this.prisma.monthlyReportDelivery.updateMany({
      where: {
        report_id: reportId,
        status: MonthlyReportDeliveryStatus.FAILED,
      },
      data: {
        status: MonthlyReportDeliveryStatus.PENDING,
        attempts: 0,
        next_attempt_at: new Date(),
        last_error: null,
      },
    });
    await this.processPendingDeliveries(reportId);
    return this.findOne(reportId, actorId, role);
  }

  @Cron(AUTO_GENERATE_CRON, { timeZone: REPORT_TIME_ZONE })
  async generatePreviousMonthDrafts() {
    const current = currentDhakaMonth();
    const previousMonth = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1),
    );
    const messes = await this.prisma.mess.findMany({
      where: {
        is_active: true,
        OR: [
          { monthly_report_setting: null },
          { monthly_report_setting: { is: { auto_generate: true } } },
        ],
      },
      select: { id: true },
    });

    for (const mess of messes) {
      try {
        const existing = await this.prisma.monthlyReport.findUnique({
          where: {
            mess_id_month: { mess_id: mess.id, month: previousMonth },
          },
          select: { id: true },
        });
        if (existing) continue;
        const bills = await this.monthlyBillService.recalculateMonthlyBills(
          mess.id,
          previousMonth,
        );
        const snapshot = await this.buildSnapshot(
          mess.id,
          previousMonth,
          bills,
        );
        const source = await this.prisma.monthlyBillingState.findUnique({
          where: {
            mess_id_month: { mess_id: mess.id, month: previousMonth },
          },
          select: { revision: true },
        });
        const report = await this.persistDraft(
          mess.id,
          previousMonth,
          snapshot,
          source?.revision ?? 0,
          null,
        );
        const managerIds =
          await this.notificationService.resolveMessManagerUserIds(mess.id);
        await this.notificationService.createForMess(
          null,
          mess.id,
          NotificationType.BILL_GENERATED,
          'Monthly report ready for review',
          snapshot.mess.name + ' monthly report is ready for review.',
          {
            source: 'MONTHLY_REPORT_READY',
            reportId: report.id,
            month: snapshot.month,
          },
          managerIds,
          '/dashboard/reports?report=' + report.id,
          'monthly-report-ready:' + report.id,
        );
      } catch (error) {
        this.logger.error(
          'Failed to auto-generate monthly report for mess ' + mess.id,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  @Cron(DELIVERY_CRON, { timeZone: REPORT_TIME_ZONE })
  async processPendingDeliveries(reportId?: string) {
    const staleBefore = new Date(Date.now() - 30 * 60 * 1000);
    await this.prisma.monthlyReportDelivery.updateMany({
      where: {
        status: MonthlyReportDeliveryStatus.PROCESSING,
        updated_at: { lt: staleBefore },
      },
      data: {
        status: MonthlyReportDeliveryStatus.FAILED,
        next_attempt_at: new Date(),
        last_error: 'Recovered interrupted delivery',
      },
    });

    const deliveries = await this.prisma.monthlyReportDelivery.findMany({
      where: {
        ...(reportId ? { report_id: reportId } : {}),
        status: {
          in: [
            MonthlyReportDeliveryStatus.PENDING,
            MonthlyReportDeliveryStatus.FAILED,
          ],
        },
        attempts: { lt: MAX_DELIVERY_ATTEMPTS },
        next_attempt_at: { lte: new Date() },
      },
      orderBy: { created_at: 'asc' },
      take: 24,
      include: {
        report: { select: { id: true, snapshot: true, status: true } },
      },
    });

    for (let index = 0; index < deliveries.length; index += 4) {
      await Promise.all(
        deliveries
          .slice(index, index + 4)
          .map((delivery) => this.deliver(delivery)),
      );
    }
  }

  private async deliver(delivery: {
    id: string;
    report_id: string;
    member_id: string;
    recipient_email: string;
    locale: string;
    attempts: number;
    report: {
      id: string;
      snapshot: Prisma.JsonValue;
      status: MonthlyReportStatus;
    };
  }) {
    const claimed = await this.prisma.monthlyReportDelivery.updateMany({
      where: {
        id: delivery.id,
        status: {
          in: [
            MonthlyReportDeliveryStatus.PENDING,
            MonthlyReportDeliveryStatus.FAILED,
          ],
        },
      },
      data: {
        status: MonthlyReportDeliveryStatus.PROCESSING,
        attempts: { increment: 1 },
        last_error: null,
      },
    });
    if (!claimed.count) return;

    try {
      const snapshot = this.readSnapshot(delivery.report.snapshot);
      const member = snapshot.members.find(
        (item) => item.memberId === delivery.member_id,
      );
      if (!member) throw new Error('Member snapshot is missing');
      const locale: ReportLocale = delivery.locale === 'bn' ? 'bn' : 'en';
      const message = this.emailContent(
        delivery.report.id,
        snapshot,
        member,
        locale,
      );
      const sent = await sendMailer(
        delivery.recipient_email,
        message.subject,
        message.html,
      );
      await this.prisma.monthlyReportDelivery.update({
        where: { id: delivery.id },
        data: {
          status: MonthlyReportDeliveryStatus.SENT,
          provider_id: sent.id ?? null,
          sent_at: new Date(),
          last_error: null,
        },
      });
    } catch (error) {
      const attempts = delivery.attempts + 1;
      const delayMinutes = Math.min(2 ** attempts * 5, 12 * 60);
      await this.prisma.monthlyReportDelivery.update({
        where: { id: delivery.id },
        data: {
          status: MonthlyReportDeliveryStatus.FAILED,
          next_attempt_at: new Date(Date.now() + delayMinutes * 60 * 1000),
          last_error: String(
            error instanceof Error ? error.message : error,
          ).slice(0, 1000),
        },
      });
      this.logger.warn(
        'Monthly report email failed for delivery ' + delivery.id,
      );
    }
  }

  private async queueDeliveries(
    reportId: string,
    snapshot: MonthlyReportSnapshot,
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: snapshot.members.map((member) => member.memberId) },
        is_active: true,
      },
      select: { id: true, email: true, preferred_locale: true },
    });
    await this.prisma.monthlyReportDelivery.createMany({
      data: users.map((user) => ({
        report_id: reportId,
        member_id: user.id,
        recipient_email: user.email.toLowerCase(),
        locale: user.preferred_locale === 'bn' ? 'bn' : 'en',
      })),
      skipDuplicates: true,
    });
  }

  private async completeFinalizationSideEffects(
    report: MonthlyReportRecord,
    actorId: string,
  ) {
    const snapshot = this.readSnapshot(report.snapshot);
    const settings = await this.prisma.monthlyReportSetting.findUnique({
      where: { mess_id: report.mess_id },
    });
    if (settings?.email_members) {
      await this.queueDeliveries(report.id, snapshot);
    }

    await this.notificationService.createForMess(
      actorId,
      report.mess_id,
      NotificationType.BILL_GENERATED,
      'Monthly report finalized',
      snapshot.mess.name + ' finalized the monthly report.',
      {
        source: 'MONTHLY_REPORT_FINALIZED',
        reportId: report.id,
        month: snapshot.month,
      },
      snapshot.members.map((member) => member.memberId),
      '/dashboard/reports?report=' + report.id,
      'monthly-report-finalized:' + report.id,
    );

    if (settings?.email_members) {
      await this.processPendingDeliveries(report.id);
    }
  }

  private emailContent(
    reportId: string,
    snapshot: MonthlyReportSnapshot,
    member: MonthlyReportMemberSnapshot,
    locale: ReportLocale,
  ) {
    const formatter = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-BD', {
      style: 'currency',
      currency: snapshot.mess.currency || 'BDT',
      maximumFractionDigits: 2,
    });
    const month = new Intl.DateTimeFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(snapshot.month));
    const link =
      config.frontendUrl.replace(/\/$/, '') +
      '/dashboard/reports?report=' +
      encodeURIComponent(reportId);
    const balance =
      member.due > 0
        ? formatter.format(member.due) + (locale === 'bn' ? ' বকেয়া' : ' due')
        : member.credit > 0
          ? formatter.format(member.credit) +
            (locale === 'bn' ? ' জমা' : ' credit')
          : locale === 'bn'
            ? 'পরিশোধিত'
            : 'Settled';
    const rows =
      locale === 'bn'
        ? [
            ['মোট মিল', member.totalMeals],
            ['মিল খরচ', formatter.format(member.mealCost)],
            ['অন্যান্য খরচ', formatter.format(member.otherCost)],
            ['মোট পরিমাণ', formatter.format(member.totalAmount)],
            ['ডিপোজিট', formatter.format(member.deposit)],
            ['ব্যালেন্স', balance],
          ]
        : [
            ['Total meals', member.totalMeals],
            ['Meal cost', formatter.format(member.mealCost)],
            ['Other cost', formatter.format(member.otherCost)],
            ['Total amount', formatter.format(member.totalAmount)],
            ['Deposit', formatter.format(member.deposit)],
            ['Balance', balance],
          ];
    const subject =
      locale === 'bn'
        ? month + ' মাসের MessZen রিপোর্ট প্রস্তুত'
        : 'Your ' + month + ' MessZen report is ready';
    const intro =
      locale === 'bn'
        ? 'আপনার মাসিক মেস রিপোর্ট চূড়ান্ত হয়েছে।'
        : 'Your monthly mess report has been finalized.';
    const action = locale === 'bn' ? 'রিপোর্ট দেখুন' : 'View report';
    const table = rows
      .map(
        ([label, value]) =>
          '<tr><td style="padding:9px 12px;border-bottom:1px solid #dce7e9;color:#617980">' +
          escapeHtml(label) +
          '</td><td style="padding:9px 12px;border-bottom:1px solid #dce7e9;text-align:right;font-weight:700;color:#173d4d">' +
          escapeHtml(value) +
          '</td></tr>',
      )
      .join('');
    return {
      subject,
      html:
        '<div style="font-family:\'Noto Sans Bengali\',Arial,sans-serif;max-width:620px;margin:auto;color:#173d4d">' +
        '<div style="border:1px solid #dce7e9;border-radius:12px;overflow:hidden">' +
        '<div style="border-left:5px solid #008d8c;padding:20px 22px;background:#f5f8f8">' +
        '<h1 style="font-size:20px;margin:0">' +
        escapeHtml(snapshot.mess.name) +
        '</h1><p style="margin:7px 0 0;color:#617980">' +
        escapeHtml(subject) +
        '</p></div><div style="padding:22px"><p>' +
        escapeHtml(intro) +
        '</p><table style="width:100%;border-collapse:collapse;margin:18px 0">' +
        table +
        '</table><a href="' +
        escapeHtml(link) +
        '" style="display:inline-block;background:#008d8c;color:white;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:700">' +
        escapeHtml(action) +
        '</a></div></div></div>',
    };
  }

  private async buildSnapshot(
    messId: string,
    month: Date,
    bills: Awaited<
      ReturnType<MonthlyBillService['recalculateMonthlyBills']>
    >,
  ): Promise<MonthlyReportSnapshot> {
    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: { id: true, name: true, currency: true },
    });
    if (!mess) throw new HttpException('Mess not found', 404);

    const members: MonthlyReportMemberSnapshot[] = bills.map((bill) => {
      const mealCost = fixed(bill.food_bill);
      const rentCost = fixed(bill.seat_rent);
      const utilityCost = fixed(bill.utility_share);
      return {
        memberId: bill.member.id,
        name: bill.member.name,
        email: bill.member.email,
        totalMeals: fixed(bill.total_meals),
        mealCost,
        otherCost: fixed(rentCost + utilityCost),
        rentCost,
        utilityCost,
        totalAmount: fixed(mealCost + rentCost + utilityCost),
        deposit: fixed(bill.deposit_total),
        paidAmount: fixed(bill.paid_amount),
        previousBalance: fixed(bill.prev_balance),
        balance: fixed(bill.balance),
        due: fixed(bill.final_due),
        credit: fixed(bill.credit_balance),
        status: bill.status,
      };
    });

    const sum = (selector: (bill: (typeof bills)[number]) => unknown) =>
      fixed(bills.reduce((total, bill) => total + Number(selector(bill) ?? 0), 0));
    const totalMeals = sum((bill) => bill.total_meals);
    const foodBazar = sum((bill) => bill.food_bill);
    const rentHouse = sum((bill) => bill.seat_rent);
    const totalUtilityShare = sum((bill) => bill.utility_share);
    const utility = fixed(
      sum((bill) => bill.electricity_bill) +
        sum((bill) => bill.gas_bill) +
        sum((bill) => bill.wifi_bill) +
        sum((bill) => bill.cleaner_bill),
    );
    const otherExpenses = fixed(Math.max(0, totalUtilityShare - utility));
    const totalExpense = fixed(foodBazar + utility + otherExpenses);
    const totalMessCost = fixed(totalExpense + rentHouse);

    return {
      schemaVersion: 1,
      mess,
      month: month.toISOString(),
      summary: {
        totalMembers: members.length,
        totalMeals,
        totalExpense,
        totalDeposit: sum((bill) => bill.deposit_total),
        mealRate: totalMeals > 0 ? fixed(sum((bill) => bill.meal_charge) / totalMeals) : 0,
        totalMessCost,
        totalDue: sum((bill) => bill.final_due),
        totalCredit: sum((bill) => bill.credit_balance),
      },
      expenseSummary: {
        foodBazar,
        utility,
        rentHouse,
        otherExpenses,
        totalExpense,
        totalMessCost,
      },
      members,
    };
  }

  private async persistDraft(
    messId: string,
    month: Date,
    snapshot: MonthlyReportSnapshot,
    sourceRevision: number,
    actorId: string | null,
  ) {
    const existing = await this.prisma.monthlyReport.findUnique({
      where: { mess_id_month: { mess_id: messId, month } },
      select: { id: true, status: true },
    });
    if (existing?.status === MonthlyReportStatus.FINALIZED) {
      throw new HttpException('Finalized monthly report cannot be changed', 409);
    }
    const data = {
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
      source_revision: sourceRevision,
      generated_by: actorId,
      generated_at: new Date(),
    };
    if (existing) {
      const updated = await this.prisma.monthlyReport.updateMany({
        where: { id: existing.id, status: MonthlyReportStatus.DRAFT },
        data: { ...data, version: { increment: 1 } },
      });
      if (!updated.count) {
        throw new HttpException('Finalized monthly report cannot be changed', 409);
      }
      return this.prisma.monthlyReport.findUniqueOrThrow({
        where: { id: existing.id },
      });
    }
    try {
      return await this.prisma.monthlyReport.create({
        data: {
          mess_id: messId,
          month,
          ...data,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const concurrent = await this.prisma.monthlyReport.findUniqueOrThrow({
          where: { mess_id_month: { mess_id: messId, month } },
        });
        if (concurrent.status === MonthlyReportStatus.FINALIZED) {
          throw new HttpException('Finalized monthly report cannot be changed', 409);
        }
        return concurrent;
      }
      throw error;
    }
  }

  private presentReport(
    report: MonthlyReportRecord,
    userId: string,
    access: ReportAccess,
  ) {
    const snapshot = this.readSnapshot(report.snapshot);
    const visibleSnapshot = access.canManage
      ? snapshot
      : {
          ...snapshot,
          members: snapshot.members.filter((member) => member.memberId === userId),
        };
    return {
      id: report.id,
      mess_id: report.mess_id,
      month: report.month,
      status: report.status,
      version: report.version,
      source_revision: report.source_revision,
      snapshot: visibleSnapshot,
      generated_at: report.generated_at,
      finalized_at: report.finalized_at,
      generated_by: report.generator,
      finalized_by: report.finalizer,
      can_manage: access.canManage,
      deliveries: access.canManage ? report.deliveries : [],
    };
  }

  private readSnapshot(value: Prisma.JsonValue) {
    if (!isMonthlyReportSnapshot(value)) {
      throw new HttpException('Monthly report snapshot is invalid', 500);
    }
    return value;
  }

  private completedMonth(monthInput: string) {
    let month: Date;
    try {
      month = billingMonthRange(monthInput).start;
    } catch {
      throw new HttpException('Invalid report month', 400);
    }
    if (month.getTime() >= currentDhakaMonth().getTime()) {
      throw new HttpException(
        'Monthly reports are available only after the month has ended',
        400,
      );
    }
    return month;
  }

  private async verifyAccess(
    messId: string,
    userId: string,
    role: string,
    managerOnly = false,
  ): Promise<ReportAccess> {
    const [mess, membership] = await Promise.all([
      this.prisma.mess.findUnique({
        where: { id: messId },
        select: { id: true, created_by: true },
      }),
      this.prisma.messMembership.findUnique({
        where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
        select: { is_active: true, role: true },
      }),
    ]);
    if (!mess) throw new HttpException('Mess not found', 404);
    const canManage =
      role === 'ADMIN' ||
      mess.created_by === userId ||
      Boolean(membership?.is_active && membership.role === 'MANAGER');
    const isMember = canManage || Boolean(membership?.is_active);
    if (managerOnly && !canManage) {
      throw new HttpException('Forbidden: Manager access is required', 403);
    }
    if (!managerOnly && !isMember) {
      throw new HttpException('Forbidden: Not a member of this mess', 403);
    }
    return { canManage, isMember };
  }
}
