import { HttpException, Injectable } from '@nestjs/common';
import {
  AttendanceStatus,
  DepositLedgerType,
  ExpensePaymentType,
  MealName,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  billingMonthRange,
  currentDhakaDate,
  currentDhakaMonth,
} from '../monthly-bill/billing-period';
import { MonthlyBillReconciliationService } from '../monthly-bill/monthly-bill-reconciliation.service';

// ─── Constants ──────────────────────────────────────────────
const MEAL_BASE_VALUE: Record<MealName, number> = {
  [MealName.BREAKFAST]: 0.5,
  [MealName.LUNCH]: 1,
  [MealName.DINNER]: 1,
};

function getMealBaseValue(mealName: MealName): number {
  return MEAL_BASE_VALUE[mealName] ?? 1;
}

/**
 * Calculate the total meal count from attendance status, meal name, and guests.
 * - OFF       → 0
 * - ON        → baseMealValue(mealName) + guests
 * - guests are stored as Decimal and represent fractional meal additions (e.g. 0.5)
 */
function calculateTotalMeals(
  status: AttendanceStatus,
  mealName: MealName,
  guests: Prisma.Decimal | number,
): number {
  if (status === AttendanceStatus.OFF) return 0;
  const baseValue = getMealBaseValue(mealName);
  const guestValue = Number(guests ?? 0);
  return +(baseValue + guestValue).toFixed(2);
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billReconciliation: MonthlyBillReconciliationService,
  ) {}

  private getMonthRange(month?: string) {
    try {
      return billingMonthRange(month ?? currentDhakaMonth());
    } catch {
      throw new HttpException('Invalid dashboard month', 400);
    }
  }

  private getUtcDayRange(date: Date = new Date()) {
    const start = currentDhakaDate(date);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  private async getMealTotals(
    messId: string,
    monthStart: Date,
    monthEnd: Date,
    today: Date,
    tomorrow: Date,
  ) {
    const rows = await this.prisma.$queryRaw<
      Array<{ today_total: number; month_total: number }>
    >(Prisma.sql`
      SELECT
        COALESCE(SUM(
          CASE WHEN m."scheduled_date" >= ${today} AND m."scheduled_date" < ${tomorrow}
            THEN (CASE WHEN m."name" = 'BREAKFAST' THEN 0.5 ELSE 1 END) + ma."guests"
            ELSE 0 END
        ), 0)::float8 AS "today_total",
        COALESCE(SUM(
          CASE WHEN m."scheduled_date" >= ${monthStart} AND m."scheduled_date" < ${monthEnd}
            THEN (CASE WHEN m."name" = 'BREAKFAST' THEN 0.5 ELSE 1 END) + ma."guests"
            ELSE 0 END
        ), 0)::float8 AS "month_total"
      FROM "meal_attendances" ma
      INNER JOIN "meals" m ON m."id" = ma."meal_id"
      WHERE m."mess_id" = ${messId}::uuid
        AND ma."status" = 'ON'
        AND m."status" <> 'CANCELLED'
        AND (
          (m."scheduled_date" >= ${monthStart} AND m."scheduled_date" < ${monthEnd})
          OR (m."scheduled_date" >= ${today} AND m."scheduled_date" < ${tomorrow})
        )
    `);
    return {
      todayTotalMeals: Number(rows[0]?.today_total ?? 0),
      totalMeals: Number(rows[0]?.month_total ?? 0),
    };
  }

  private async verifyMessMember(messId: string, userId: string, role: string) {
    if (role === 'ADMIN') return;
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;
    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!membership?.is_active)
      throw new HttpException('Forbidden: Not a member of this mess', 403);
  }

  async getMessDashboard(
    messId: string,
    userId: string,
    role: string,
    month?: string,
  ) {
    await this.verifyMessMember(messId, userId, role);
    const { start, end } = this.getMonthRange(month);
    const { start: today, end: tomorrow } = this.getUtcDayRange();
    const previousMonth = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 1, 1),
    );

    const [
      billingState,
      mealTotals,
      monthlyExpenses,
      monthlyExtraExpenses,
      personalExpenseCredits,
      totalPayment,
      directDeposits,
      billsAgg,
      previousBillsAgg,
      activeMembers,
      pendingPayments,
      notices,
      complaints,
    ] = await Promise.all([
      this.billReconciliation.ensureScheduled(messId, start),
      this.getMealTotals(messId, start, end, today, tomorrow),
      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          category: {
            in: ['FOOD', 'GROCERY'],
          },
          status: 'CONFIRMED',
          payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
          NOT: {
            payment_type: ExpensePaymentType.PERSONAL,
            used_by: 'SELF_ONLY',
          },
          billing_month: start,
        },
        _sum: { amount: true },
      }),
      // Extra expenses = all categories except FOOD
      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          category: {
            notIn: ['FOOD', 'GROCERY', 'RENT'],
          },
          status: 'CONFIRMED',
          payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
          NOT: {
            payment_type: ExpensePaymentType.PERSONAL,
            used_by: 'SELF_ONLY',
          },
          billing_month: start,
        },
        _sum: { amount: true },
      }),
      this.prisma.depositLedger.aggregate({
        where: {
          mess_id: messId,
          type: DepositLedgerType.PERSONAL_EXPENSE_CREDIT,
          direction: 'CREDIT',
          expense: {
            is: {
              status: 'CONFIRMED',
              billing_month: start,
            },
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          mess_id: messId,
          status: 'APPROVED',
          OR: [
            { monthly_bill: { month: start } },
            {
              monthly_bill_id: null,
              payment_date: { gte: start, lt: end },
            },
            {
              monthly_bill_id: null,
              payment_date: null,
              created_at: { gte: start, lt: end },
            },
          ],
        },
        _sum: { amount: true },
      }),
      this.prisma.deposit.aggregate({
        where: {
          mess_id: messId,
          deposit_date: { gte: start, lt: end },
        },
        _sum: { amount: true },
      }),
      this.prisma.monthlyBill.aggregate({
        where: { mess_id: messId, month: start },
        _count: { _all: true },
        _sum: {
          final_due: true,
          credit_balance: true,
          balance: true,
          food_bill: true,
          utility_share: true,
          seat_rent: true,
          paid_amount: true,
          prev_balance: true,
          deposit_total: true,
        },
      }),
      this.prisma.monthlyBill.aggregate({
        where: { mess_id: messId, month: previousMonth },
        _sum: { balance: true },
      }),
      this.prisma.messMembership.findMany({
        where: {
          mess_id: messId,
          joined_at: { lt: end },
          OR: [{ is_active: true }, { left_at: { gte: start } }],
        },
        select: { monthly_rent: true, room_no: true },
      }),
      this.prisma.payment.count({
        where: { mess_id: messId, status: 'PENDING' },
      }),
      this.prisma.notice.findMany({
        where: { mess_id: messId },
        take: 5,
        orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
        select: {
          id: true,
          title: true,
          type: true,
          is_pinned: true,
          created_at: true,
        },
      }),
      this.prisma.complaint.count({
        where: { mess_id: messId, status: { in: ['PENDING', 'PROCESSING'] } },
      }),
    ]);

    // Calculate today's total meals using base value + guests per meal type
    const { todayTotalMeals, totalMeals } = mealTotals;

    // Calculate monthly total meals using base value + guests per meal type
    const hasGeneratedBills = billsAgg._count._all > 0;
    const totalBazar = hasGeneratedBills
      ? Number(billsAgg._sum.food_bill ?? 0)
      : Number(monthlyExpenses._sum.amount ?? 0);
    const currentMealRate =
      totalMeals > 0 ? Number((totalBazar / totalMeals).toFixed(2)) : 0;
    const personalExpenseCreditAmount = Number(
      personalExpenseCredits._sum.amount ?? 0,
    );

    const activeMembersCount = activeMembers.length;
    const extraExpenses = hasGeneratedBills
      ? Number(billsAgg._sum.utility_share ?? 0)
      : Number(monthlyExtraExpenses._sum.amount ?? 0);
    const perExtraExpenses =
      activeMembersCount > 0
        ? Number((extraExpenses / activeMembersCount).toFixed(2))
        : 0;

    // Calculate total room rent same way as monthly bills
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    const rooms = Array.isArray(mess?.rooms) ? mess.rooms : [];

    const totalRoomRent = hasGeneratedBills
      ? Number(billsAgg._sum.seat_rent ?? 0)
      : activeMembersCount > 0
        ? activeMembers.reduce((sum, member) => {
            const roomRent = this.getRoomRentPerMember(
              rooms,
              member.room_no,
              Number(member.monthly_rent),
              Number(mess?.monthly_rent),
            );
            return sum + (roomRent || 0);
          }, 0)
        : 0;
    const totalCost = totalBazar + extraExpenses + totalRoomRent;

    // ── Prev-balance logic (carry-over from previous month) ────────────────────
    const prevBalanceTotal = Number(previousBillsAgg._sum.balance ?? 0);

    // If the mess was registered THIS month, there are no previous bills,
    // so prev_balance is 0 for all members (they start fresh).
    const messRegisteredThisMonth =
      mess && mess.created_at >= start && mess.created_at < end;
    const effectivePrevBalance = messRegisteredThisMonth ? 0 : prevBalanceTotal;

    const currentPaidAmount =
      Number(totalPayment._sum.amount ?? 0) +
      Number(directDeposits._sum.amount ?? 0) +
      personalExpenseCreditAmount;
    const totalDepositAmount = Number(currentPaidAmount.toFixed(2));

    const billedTotalDue = Number(billsAgg._sum.final_due ?? 0);
    const billedRemainingAmount = Number(billsAgg._sum.credit_balance ?? 0);
    const estimatedBalance = Number(
      (totalCost - currentPaidAmount + effectivePrevBalance).toFixed(2),
    );

    // Generated bills preserve per-member due and credit. The fallback is only
    // used during the first background calculation.
    const totalDue = Number(
      (hasGeneratedBills
        ? billedTotalDue
        : Math.max(estimatedBalance, 0)
      ).toFixed(2),
    );
    const remainingAmount = Number(
      (hasGeneratedBills
        ? billedRemainingAmount
        : Math.max(-estimatedBalance, 0)
      ).toFixed(2),
    );
    const netBalance = Number((totalDue - remainingAmount).toFixed(2));

    return {
      todayTotalMeals: +todayTotalMeals.toFixed(2),
      totalMeals: +totalMeals.toFixed(2),
      currentMonthTotalBazar: totalBazar,
      extraExpenses,
      perExtraExpenses,
      currentMealRate,
      totalDue,
      remainingAmount,
      netBalance,
      totalDepositAmount,
      paidAmount:
        Number(totalPayment._sum.amount ?? 0) +
        Number(directDeposits._sum.amount ?? 0),
      activeMembers: activeMembersCount,
      pendingPayments,
      openComplaints: complaints,
      notices,
      totalRoomRent,
      totalCost,
      billingStatus: billingState?.status ?? 'DIRTY',
      billingCalculatedAt: billingState?.calculated_at ?? null,
      billingDataFresh: billingState?.status === 'READY',
    };
  }

  /**
   * Get daily expense and payment (income) data for the monthly overview chart
   */
  async getMonthlyOverview(
    messId: string,
    userId: string,
    role: string,
    month?: string,
  ) {
    await this.verifyMessMember(messId, userId, role);
    const { start, end } = this.getMonthRange(month);

    // Get all expenses for the month, grouped by date
    const expenses = await this.prisma.expense.findMany({
      where: {
        mess_id: messId,
        status: 'CONFIRMED',
        payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
        billing_month: start,
      },
      select: {
        amount: true,
        expense_date: true,
      },
      orderBy: { expense_date: 'asc' },
    });

    // Get all approved payments for the month (income/deposit)
    const payments = await this.prisma.payment.findMany({
      where: {
        mess_id: messId,
        status: 'APPROVED',
        OR: [
          { payment_date: { gte: start, lt: end } },
          {
            payment_date: null,
            created_at: { gte: start, lt: end },
          },
        ],
      },
      select: {
        amount: true,
        payment_date: true,
        created_at: true,
      },
      orderBy: [{ payment_date: 'asc' }, { created_at: 'asc' }],
    });

    // Build a map of dates within the month range
    const dailyMap = new Map<string, { expense: number; income: number }>();
    const current = new Date(start);
    while (current < end) {
      const key = current.toISOString().slice(0, 10); // YYYY-MM-DD
      dailyMap.set(key, { expense: 0, income: 0 });
      current.setDate(current.getDate() + 1);
    }

    // Aggregate expenses by date
    for (const exp of expenses) {
      const key = exp.expense_date.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.expense += Number(exp.amount);
      }
    }

    // Aggregate payments by date
    for (const pay of payments) {
      const key = (pay.payment_date ?? pay.created_at)
        .toISOString()
        .slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.income += Number(pay.amount);
      }
    }

    // Format for chart: each data point has day label, income, expense
    const data: Array<{ day: string; income: number; expense: number }> = [];
    for (const [dateStr, values] of dailyMap) {
      const day = new Date(dateStr + 'T00:00:00');
      const label = `${String(day.getDate()).padStart(2, '0')} ${day.toLocaleString('en', { month: 'short' })}`;
      data.push({
        day: label,
        income: Number(values.income.toFixed(2)),
        expense: Number(values.expense.toFixed(2)),
      });
    }

    return data;
  }

  /**
   * Get expense breakdown by category for the pie chart
   */
  async getExpenseBreakdown(
    messId: string,
    userId: string,
    role: string,
    month?: string,
  ) {
    await this.verifyMessMember(messId, userId, role);
    const { start, end } = this.getMonthRange(month);

    const expenses = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        mess_id: messId,
        status: 'CONFIRMED',
        payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
        billing_month: start,
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const categoryColors: Record<string, string> = {
      FOOD: '#2f80ed',
      GROCERY: '#58d68d',
      UTILITY: '#ffb84d',
      RENT: '#ff4d4f',
      GAS: '#8b5cf6',
      ELECTRICITY: '#f59e0b',
      WIFI: '#14b8a6',
      CLEANER: '#ec4899',
      MAINTENANCE: '#6366f1',
      BUABILL: '#f97316',
      WATER: '#06b6d4',
      OTHER: '#94a3b8',
    };

    const totalAmount = expenses.reduce(
      (sum, e) => sum + Number(e._sum.amount ?? 0),
      0,
    );

    const data = expenses.map((e) => ({
      name: e.category.charAt(0) + e.category.slice(1).toLowerCase(), // Capitalize first letter
      value:
        totalAmount > 0
          ? Number(
              ((Number(e._sum.amount ?? 0) / totalAmount) * 100).toFixed(1),
            )
          : 0,
      amount: Number(e._sum.amount ?? 0),
      color: categoryColors[e.category] || '#94a3b8',
    }));

    return { data, totalAmount };
  }

  /**
   * Get weekly meal counts (Mon-Sun) for the bar chart
   */
  async getWeeklyMealCount(
    messId: string,
    userId: string,
    role: string,
    date?: string,
  ) {
    await this.verifyMessMember(messId, userId, role);

    // Determine the week range (Mon-Sun)
    const refDate = date ? new Date(date) : new Date();
    const dayOfWeek = refDate.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
    // Monday = 1, so we need to calculate diff accordingly
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Go back to Monday
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Get all meals for this week
    const meals = await this.prisma.meal.findMany({
      where: {
        mess_id: messId,
        scheduled_date: { gte: monday, lt: sunday },
        status: { not: 'CANCELLED' },
      },
      select: {
        name: true,
        scheduled_date: true,
        attendances: {
          where: { status: 'ON' },
          select: { guests: true },
        },
      },
      orderBy: { scheduled_date: 'asc' },
    });

    // Initialize daily counts
    const dailyData: Record<
      string,
      { breakfast: number; lunch: number; dinner: number }
    > = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dailyData[d.toISOString().slice(0, 10)] = {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
      };
    }

    // Aggregate meals by day and meal name using fractional calculation
    for (const meal of meals) {
      const key = meal.scheduled_date.toISOString().slice(0, 10);
      const entry = dailyData[key];
      if (!entry) continue;
      const mealName = meal.name;

      // Sum up total meals using base meal value + guests per attendee
      const count = meal.attendances.reduce((sum, a) => {
        return (
          sum + calculateTotalMeals(AttendanceStatus.ON, mealName, a.guests)
        );
      }, 0);

      if (mealName === MealName.BREAKFAST) entry.breakfast += count;
      else if (mealName === MealName.LUNCH) entry.lunch += count;
      else if (mealName === MealName.DINNER) entry.dinner += count;
    }

    // Format for chart
    const data: Array<{
      day: string;
      breakfast: number;
      lunch: number;
      dinner: number;
    }> = [];
    let idx = 0;
    for (const counts of Object.values(dailyData)) {
      data.push({
        day: dayNames[idx % 7],
        breakfast: +counts.breakfast.toFixed(2),
        lunch: +counts.lunch.toFixed(2),
        dinner: +counts.dinner.toFixed(2),
      });
      idx++;
    }

    return data;
  }

  private getRoomRentPerMember(
    rooms: Prisma.JsonValue[],
    roomNo?: string | null,
    memberMonthlyRent?: number | null,
    messMonthlyRent?: number | null,
  ): number {
    if (!roomNo) {
      if (memberMonthlyRent && memberMonthlyRent > 0) return memberMonthlyRent;
      if (messMonthlyRent && messMonthlyRent > 0) return messMonthlyRent;
      return 0;
    }

    const roomConfig = rooms.find((room) => {
      if (!room || typeof room !== 'object' || Array.isArray(room))
        return false;
      return (room as Record<string, unknown>)['roomName'] === roomNo;
    });

    if (
      !roomConfig ||
      typeof roomConfig !== 'object' ||
      Array.isArray(roomConfig)
    ) {
      if (memberMonthlyRent && memberMonthlyRent > 0) return memberMonthlyRent;
      if (messMonthlyRent && messMonthlyRent > 0) return messMonthlyRent;
      return 0;
    }

    const room = roomConfig as Record<string, unknown>;
    const roomPrice = Number(room['roomPrice'] ?? 0);
    const totalPerson = Number(room['perPerson'] ?? 0);

    if (roomPrice > 0 && totalPerson > 0) {
      return Number((roomPrice / totalPerson).toFixed(2));
    }

    if (memberMonthlyRent && memberMonthlyRent > 0) return memberMonthlyRent;
    if (messMonthlyRent && messMonthlyRent > 0) return messMonthlyRent;
    return 0;
  }

  async getAdminDashboard() {
    const [
      users,
      pendingRequests,
      approvedRequests,
      messes,
      pendingComplaints,
      pendingPayments,
      recentExpenses,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.messRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.messRequest.count({ where: { status: 'APPROVED' } }),
      this.prisma.mess.count(),
      this.prisma.complaint.count({
        where: { status: { in: ['PENDING', 'PROCESSING'] } },
      }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.expense.findMany({
        where: { receipt_url: { not: null } },
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          item_name: true,
          category: true,
          amount: true,
          receipt_url: true,
          expense_date: true,
          mess: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return {
      users,
      pendingRequests,
      approvedRequests,
      messes,
      pendingComplaints,
      pendingPayments,
      recentExpenses,
    };
  }
}
