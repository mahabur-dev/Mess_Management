import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildBillingMonthSequence } from './billing-month-sequence';
import { MonthlyBillService } from './monthly-bill.service';

export type BillingSyncStatus = 'SYNCED' | 'RECALCULATION_REQUIRED';

@Injectable()
export class MonthlyBillReconciliationService {
  private readonly logger = new Logger(MonthlyBillReconciliationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlyBillService: MonthlyBillService,
  ) {}

  async reconcile(
    messId: string,
    ...effectiveDates: Array<Date | null | undefined>
  ): Promise<BillingSyncStatus> {
    const requestedDates = effectiveDates.filter((date): date is Date =>
      Boolean(date),
    );
    const requestedMonths = buildBillingMonthSequence(requestedDates);
    if (!requestedMonths.length) return 'SYNCED';

    let currentMonth = requestedMonths[0];
    try {
      const existingMonths = await this.prisma.monthlyBill.findMany({
        where: {
          mess_id: messId,
          month: { gte: requestedMonths[0] },
        },
        distinct: ['month'],
        select: { month: true },
        orderBy: { month: 'asc' },
      });
      const months = buildBillingMonthSequence(
        requestedMonths,
        existingMonths.map((bill) => bill.month),
      );

      for (const month of months) {
        currentMonth = month;
        await this.monthlyBillService.recalculateMonthlyBills(messId, month);
      }
    } catch (error) {
      this.logger.error(
        `Monthly bill reconciliation failed for mess ${messId} and month ${currentMonth.toISOString()}`,
        error instanceof Error ? error.stack : String(error),
      );
      return 'RECALCULATION_REQUIRED';
    }

    return 'SYNCED';
  }
}
