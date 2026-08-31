import { HttpException, Injectable } from '@nestjs/common';
import {
  BillFilterDto,
  GenerateBillDto,
  UpdateBillStatusDto,
} from './dto/monthly-bill.dto';
import {
  AttendanceStatus,
  DepositLedgerType,
  ExpenseCategory,
  ExpensePaymentType,
  ExpenseSplitMethod,
  ExpenseUsedBy,
  MealName,
  NotificationType,
  Prisma,
  RequestStatus,
} from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import config from 'src/app/config';
import {
  allocateAmountByWeight,
  calculateMemberBalance,
} from './billing-calculator';
import { billingMonthRange, currentDhakaMonth } from './billing-period';
import {
  calculateMemberFoodBill,
  communalMealExpenseWhere,
  isCommunalMealExpense,
} from '../expense/expense-accounting';
import { NotificationService } from '../notification/notification.service';
import sendMailer from 'src/app/helpers/sendMailer';
import {
  BillCloseRequestFilterDto,
  ReviewBillCloseRequestDto,
} from './dto/monthly-bill.dto';

// ─── Constants ──────────────────────────────────────────────
/**
 * Base meal value per meal type when attendance is ON.
 * BREAKFAST = 0.5 meal, LUNCH = 1 meal, DINNER = 1 meal.
 */
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

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

@Injectable()
export class MonthlyBillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private readonly closeRequestSelect = {
    id: true,
    status: true,
    original_balance: true,
    original_final_due: true,
    original_credit_balance: true,
    original_status: true,
    review_note: true,
    requested_at: true,
    reviewed_at: true,
    requester: { select: { id: true, name: true, email: true } },
    reviewer: { select: { id: true, name: true, email: true } },
  } as const;

  private readonly billSelect = {
    id: true,
    month: true,
    total_meals: true,
    meal_charge: true,
    food_bill: true,
    seat_rent: true,
    electricity_bill: true,
    gas_bill: true,
    wifi_bill: true,
    cleaner_bill: true,
    extra_cost: true,
    utility_share: true,
    deposit_total: true,
    paid_amount: true,
    final_due: true,
    credit_balance: true,
    prev_balance: true,
    balance: true,
    status: true,
    due_date: true,
    generated_at: true,
    mess: { select: { id: true, name: true } },
    member: { select: { id: true, name: true, email: true, avatar_url: true } },
    close_requests: {
      orderBy: { requested_at: 'desc' as const },
      take: 1,
      select: this.closeRequestSelect,
    },
  } as const;

  private getBillMonthRange(monthInput: string | Date) {
    try {
      const { start: month, end: nextMonth } = billingMonthRange(monthInput);
      return { month, nextMonth };
    } catch {
      throw new HttpException('Invalid billing month', 400);
    }
  }

  private toFixedNumber(value: unknown) {
    return Number(Number(value ?? 0).toFixed(2));
  }

  private toPositiveNumber(value: unknown): number | null {
    const amount = Number(value ?? 0);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }

  private getRoomRentPerMember(
    rooms: Prisma.JsonValue[],
    roomNo?: string | null,
  ): number | null {
    if (!roomNo) return null;

    const roomConfig = rooms.find((room) => {
      if (!room || typeof room !== 'object' || Array.isArray(room)) {
        return false;
      }

      return (room as Record<string, unknown>)['roomName'] === roomNo;
    });

    if (
      !roomConfig ||
      typeof roomConfig !== 'object' ||
      Array.isArray(roomConfig)
    ) {
      return null;
    }

    const room = roomConfig as Record<string, unknown>;
    const roomPrice = this.toPositiveNumber(room['roomPrice']);
    const totalPerson = this.toPositiveNumber(room['perPerson']);

    if (!roomPrice || !totalPerson) return null;

    return this.toFixedNumber(roomPrice / totalPerson);
  }

  private calculateSeatRent(
    rooms: Prisma.JsonValue[],
    roomNo: string | null | undefined,
    memberMonthlyRent: unknown,
    messMonthlyRent: unknown,
  ): number {
    const roomRent = this.getRoomRentPerMember(rooms, roomNo);
    if (roomRent !== null) return roomRent;

    const membershipRent = this.toPositiveNumber(memberMonthlyRent);
    if (membershipRent !== null) return this.toFixedNumber(membershipRent);

    return this.toFixedNumber(messMonthlyRent);
  }

  private makeAmountMap(
    rows: Array<{ member_id: string; _sum: { amount: unknown } }>,
  ) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.member_id] = this.toFixedNumber(row._sum.amount);
      return acc;
    }, {});
  }

  private async verifyGeneratePermission(
    messId: string,
    managerId: string,
    role: string,
  ) {
    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
    });

    if (!mess) {
      throw new HttpException('Mess not found', 404);
    }

    if (role === 'ADMIN') {
      return mess;
    }

    const membership = await this.prisma.messMembership.findUnique({
      where: {
        mess_id_user_id: {
          mess_id: messId,
          user_id: managerId,
        },
      },
    });

    const isMessOwner = mess.created_by === managerId;
    const isManager = membership?.is_active && membership.role === 'MANAGER';

    if (!isMessOwner && !isManager) {
      throw new HttpException('Forbidden: Not your mess', 403);
    }

    return mess;
  }

  private async ensureActiveSubscription(messId: string, role: string) {
    if (!config.features.subscriptionEnabled || role === 'ADMIN') return;

    const subscription = await this.prisma.subscription.findUnique({
      where: { mess_id: messId },
      select: { status: true, end_date: true },
    });

    const isActive =
      subscription?.status === 'ACTIVE' &&
      (!subscription.end_date || subscription.end_date.getTime() >= Date.now());

    if (!isActive) {
      throw new HttpException(
        'Your subscription has expired. Please renew it to continue using bill features.',
        403,
      );
    }
  }

  async generate(managerId: string, role: string, dto: GenerateBillDto) {
    await this.verifyGeneratePermission(dto.messId, managerId, role);
    await this.ensureActiveSubscription(dto.messId, role);

    return this.recalculateMonthlyBills(dto.messId, dto.month);
  }

  async recalculateMonthlyBills(messId: string, monthInput: string | Date) {
    const { month, nextMonth } = this.getBillMonthRange(monthInput);

    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
    });

    if (!mess) {
      throw new HttpException('Mess not found', 404);
    }

    const activeMembers = await this.prisma.messMembership.findMany({
      where: {
        mess_id: messId,
        joined_at: { lt: nextMonth },
        OR: [{ is_active: true }, { left_at: { gte: month } }],
      },
      select: {
        user_id: true,
        monthly_rent: true,
        room_no: true,
      },
    });

    if (!activeMembers.length) {
      await this.prisma.monthlyBill.deleteMany({
        where: { mess_id: messId, month },
      });
      return [];
    }

    const rooms = Array.isArray(mess.rooms) ? mess.rooms : [];

    const [
      foodExpenses,
      electricityExpenses,
      gasExpenses,
      wifiExpenses,
      cleanerExpenses,
      utilityExpenses,
      mealAttendances,
      depositGroups,
      paymentGroups,
      expenseShares,
      personalCreditGroups,
    ] = await Promise.all([
      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          billing_month: month,
          status: 'CONFIRMED',
          payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
          ...communalMealExpenseWhere,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          billing_month: month,
          status: 'CONFIRMED',
          payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
          shares: { none: {} },
          category: ExpenseCategory.ELECTRICITY,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          billing_month: month,
          status: 'CONFIRMED',
          payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
          shares: { none: {} },
          category: ExpenseCategory.GAS,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          billing_month: month,
          status: 'CONFIRMED',
          payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
          shares: { none: {} },
          category: ExpenseCategory.WIFI,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          billing_month: month,
          status: 'CONFIRMED',
          payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
          shares: { none: {} },
          category: ExpenseCategory.CLEANER,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          billing_month: month,
          status: 'CONFIRMED',
          payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
          shares: { none: {} },
          category: {
            in: [
              ExpenseCategory.UTILITY,
              ExpenseCategory.MAINTENANCE,
              ExpenseCategory.BUABILL,
              ExpenseCategory.WATER,
              ExpenseCategory.OTHER,
              ExpenseCategory.ELECTRICITY,
              ExpenseCategory.CLEANER,
              ExpenseCategory.WIFI,
              ExpenseCategory.GAS,
            ],
          },
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.mealAttendance.findMany({
        where: {
          meal: {
            mess_id: messId,
            status: { not: 'CANCELLED' },
            scheduled_date: {
              gte: month,
              lt: nextMonth,
            },
          },
          status: 'ON',
        },
        select: {
          member_id: true,
          guests: true,
          meal: {
            select: {
              name: true,
            },
          },
        },
      }),

      this.prisma.deposit.groupBy({
        by: ['member_id'],
        where: {
          mess_id: messId,
          deposit_date: {
            gte: month,
            lt: nextMonth,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.payment.groupBy({
        by: ['member_id'],
        where: {
          mess_id: messId,
          status: 'APPROVED',
          OR: [
            { monthly_bill: { month } },
            {
              monthly_bill_id: null,
              payment_date: { gte: month, lt: nextMonth },
            },
            {
              monthly_bill_id: null,
              payment_date: null,
              created_at: { gte: month, lt: nextMonth },
            },
          ],
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expenseShare.findMany({
        where: {
          expense: {
            mess_id: messId,
            billing_month: month,
            status: 'CONFIRMED',
            payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
          },
        },
        orderBy: [{ expense_id: 'asc' }, { created_at: 'asc' }],
        select: {
          expense_id: true,
          member_id: true,
          share_amount: true,
          expense: {
            select: {
              category: true,
              amount: true,
              split_method: true,
              used_by: true,
              payment_type: true,
            },
          },
        },
      }),

      this.prisma.depositLedger.groupBy({
        by: ['member_id'],
        where: {
          mess_id: messId,
          type: DepositLedgerType.PERSONAL_EXPENSE_CREDIT,
          direction: 'CREDIT',
          member_id: { not: null },
          expense: {
            is: {
              mess_id: messId,
              billing_month: month,
              status: 'CONFIRMED',
            },
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const mealCountByUser: Record<string, number> = {};
    let totalMeals = 0;

    for (const attendance of mealAttendances) {
      const mealCount = calculateTotalMeals(
        AttendanceStatus.ON,
        attendance.meal.name as MealName,
        attendance.guests,
      );

      mealCountByUser[attendance.member_id] =
        (mealCountByUser[attendance.member_id] ?? 0) + mealCount;

      totalMeals += mealCount;
    }

    const totalCommunalFoodExpense = this.toFixedNumber(
      foodExpenses._sum.amount,
    );

    const perMealRate =
      totalMeals > 0 ? totalCommunalFoodExpense / totalMeals : 0;

    const depositByUser = this.makeAmountMap(depositGroups);
    const paymentByUser = this.makeAmountMap(paymentGroups);
    const personalCreditByUser = personalCreditGroups.reduce<
      Record<string, number>
    >((acc, row) => {
      if (row.member_id)
        acc[row.member_id] = this.toFixedNumber(row._sum.amount);
      return acc;
    }, {});

    const allocatedFoodByUser: Record<string, number> = {};
    const allocatedUtilityByUser: Record<string, number> = {};
    const allocatedRentByUser: Record<string, number> = {};

    const sharesByExpense = new Map<string, typeof expenseShares>();
    for (const share of expenseShares) {
      const rows = sharesByExpense.get(share.expense_id) ?? [];
      rows.push(share);
      sharesByExpense.set(share.expense_id, rows);
    }

    for (const shares of sharesByExpense.values()) {
      const expense = shares[0].expense;
      if (
        expense.payment_type === ExpensePaymentType.PERSONAL &&
        expense.used_by === ExpenseUsedBy.SELF_ONLY
      ) {
        continue;
      }

      // Communal FOOD/GROCERY is billed exclusively through the mess meal rate.
      // Its persisted shares are useful for previews/auditing, but including them
      // here would charge members a second time as an assigned expense.
      if (isCommunalMealExpense(expense)) continue;

      let allocated = new Map(
        shares.map((share) => [
          share.member_id,
          this.toFixedNumber(share.share_amount),
        ]),
      );
      if (expense.split_method === ExpenseSplitMethod.MEAL_COUNT) {
        const weighted = allocateAmountByWeight(
          Number(expense.amount),
          shares.map((share) => ({
            memberId: share.member_id,
            weight: mealCountByUser[share.member_id] ?? 0,
          })),
        );
        if (weighted.size) allocated = weighted;
      }

      for (const [memberId, value] of allocated) {
        const category = expense.category;
        if (
          category === ExpenseCategory.FOOD ||
          category === ExpenseCategory.GROCERY
        ) {
          allocatedFoodByUser[memberId] = this.toFixedNumber(
            (allocatedFoodByUser[memberId] ?? 0) + value,
          );
        } else if (category === ExpenseCategory.RENT) {
          allocatedRentByUser[memberId] = this.toFixedNumber(
            (allocatedRentByUser[memberId] ?? 0) + value,
          );
        } else {
          allocatedUtilityByUser[memberId] = this.toFixedNumber(
            (allocatedUtilityByUser[memberId] ?? 0) + value,
          );
        }
      }
    }

    const splitByMember = (value: unknown) =>
      activeMembers.length > 0
        ? this.toFixedNumber(Number(value ?? 0) / activeMembers.length)
        : 0;

    const electricityShare = splitByMember(electricityExpenses._sum.amount);
    const gasShare = splitByMember(gasExpenses._sum.amount);
    const wifiShare = splitByMember(wifiExpenses._sum.amount);
    const cleanerShare = splitByMember(cleanerExpenses._sum.amount);
    const utilityExpensesAmount = splitByMember(utilityExpenses._sum.amount);
    const utilityPerMember = this.toFixedNumber(utilityExpensesAmount);
    // console.log("perMember : ", utilityPerMember);

    // Fetch previous month's bills to get balances carried forward
    const prevMonthStart = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1),
    );
    const prevBills = await this.prisma.monthlyBill.findMany({
      where: {
        mess_id: messId,
        month: prevMonthStart,
        member_id: { in: activeMembers.map((m) => m.user_id) },
      },
      select: { member_id: true, balance: true },
    });
    const prevBalanceByMember: Record<string, number> = {};
    for (const pb of prevBills) {
      prevBalanceByMember[pb.member_id] = this.toFixedNumber(pb.balance);
    }

    const approvedCloseRequests =
      await this.prisma.monthlyBillCloseRequest.findMany({
        where: {
          mess_id: messId,
          status: RequestStatus.APPROVED,
          bill: { month },
        },
        select: { member_id: true },
      });
    const closedMemberIds = new Set(
      approvedCloseRequests.map((request) => request.member_id),
    );

    const dueDate = new Date(month);
    dueDate.setDate(mess.payment_deadline_day ?? 10);

    const billWrites: Prisma.MonthlyBillUpsertArgs[] = activeMembers.map(
      ({ user_id, monthly_rent, room_no }) => {
        const prevBalance = prevBalanceByMember[user_id] ?? 0;
        const memberMeals = mealCountByUser[user_id] ?? 0;

        const { regularMealCharge, totalFoodBill: foodBill } =
          calculateMemberFoodBill({
            memberMeals,
            communalMealRate: perMealRate,
            assignedFoodExpense: allocatedFoodByUser[user_id] ?? 0,
          });
        // console.log("food bill : ", foodBill)
        const seatRent = this.toFixedNumber(
          this.calculateSeatRent(
            rooms,
            room_no,
            monthly_rent,
            mess.monthly_rent,
          ) + (allocatedRentByUser[user_id] ?? 0),
        );

        const depositTotal = this.toFixedNumber(
          (depositByUser[user_id] ?? 0) + (personalCreditByUser[user_id] ?? 0),
        );
        const paidAmount = paymentByUser[user_id] ?? 0;
        const allocatedUtility = allocatedUtilityByUser[user_id] ?? 0;

        // deposit_total already includes auto-created deposits from PERSONAL expenses
        const memberBalance = calculateMemberBalance({
          currentCost:
            foodBill + seatRent + utilityPerMember + allocatedUtility,
          deposits: depositTotal,
          payments: paidAmount,
          previousBalance: prevBalance,
        });
        const isClosed = closedMemberIds.has(user_id);

        // Include previous month's balance in the current month's calculation
        // prevBalance from DB: Positive (+) = due/baki from last month → gets added to current costs
        //                     Negative (-) = extra/overpaid from last month → gets subtracted from costs (credit)
        // Formula: due = max(0, totalCost - totalPaid + prevBalance)
        // When prevBalance is +500 (due): costs - payments + 500 → increases due ✓
        // When prevBalance is -200 (extra): costs - payments - 200 → decreases due (credit) ✓

        // balance stores the actual net position (can be negative for overpayments)
        // This ensures prev_balance carries forward properly as credit

        const billData = {
          total_meals: memberMeals,
          meal_charge: regularMealCharge,
          food_bill: foodBill,
          seat_rent: seatRent,
          electricity_bill: electricityShare,
          gas_bill: gasShare,
          wifi_bill: wifiShare,
          cleaner_bill: cleanerShare,
          extra_cost: this.toFixedNumber(
            utilityExpensesAmount + allocatedUtility,
          ),
          utility_share: this.toFixedNumber(
            utilityPerMember + allocatedUtility,
          ),
          deposit_total: depositTotal,
          paid_amount: paidAmount,
          prev_balance: prevBalance,
          final_due: isClosed ? 0 : memberBalance.finalDue,
          credit_balance: isClosed ? 0 : memberBalance.creditBalance,
          balance: isClosed ? 0 : memberBalance.balance,
          due_date: dueDate,
          status: isClosed ? ('PAID' as const) : memberBalance.status,
          generated_at: new Date(),
        };

        return {
          where: {
            mess_id_member_id_month: {
              mess_id: messId,
              member_id: user_id,
              month,
            },
          },
          update: billData,
          create: {
            mess_id: messId,
            member_id: user_id,
            month,
            ...billData,
          },
          select: this.billSelect,
        };
      },
    );

    await this.prisma.$transaction(
      [
        this.prisma.monthlyBill.deleteMany({
          where: {
            mess_id: messId,
            month,
            member_id: {
              notIn: activeMembers.map((member) => member.user_id),
            },
          },
        }),
        ...billWrites.map((billWrite) =>
          this.prisma.monthlyBill.upsert(billWrite),
        ),
      ],
      { maxWait: 5_000, timeout: 20_000 },
    );

    return this.prisma.monthlyBill.findMany({
      where: { mess_id: messId, month },
      orderBy: { member: { name: 'asc' } },
      select: this.billSelect,
    });
  }

  async requestClose(billId: string, userId: string) {
    const bill = await this.prisma.monthlyBill.findUnique({
      where: { id: billId },
      select: {
        id: true,
        mess_id: true,
        member_id: true,
        month: true,
        balance: true,
        final_due: true,
        credit_balance: true,
        status: true,
        mess: { select: { name: true } },
        member: { select: { name: true, email: true } },
        close_requests: {
          where: { status: { in: [RequestStatus.PENDING, RequestStatus.APPROVED] } },
          select: { id: true, status: true },
        },
      },
    });

    if (!bill) throw new HttpException('Bill not found', 404);
    if (bill.member_id !== userId) {
      throw new HttpException('You can only close your own monthly bill', 403);
    }
    if (bill.month.getTime() >= currentDhakaMonth().getTime()) {
      throw new HttpException(
        'The current month cannot be closed before it is completed',
        400,
      );
    }
    if (this.toFixedNumber(bill.balance) === 0) {
      throw new HttpException('This bill has no balance to close', 400);
    }

    const existing = bill.close_requests[0];
    if (existing?.status === RequestStatus.PENDING) {
      throw new HttpException('A close request is already pending', 409);
    }
    if (existing?.status === RequestStatus.APPROVED) {
      throw new HttpException('This bill has already been closed', 409);
    }

    let request;
    try {
      request = await this.prisma.monthlyBillCloseRequest.create({
        data: {
          monthly_bill_id: bill.id,
          mess_id: bill.mess_id,
          member_id: bill.member_id,
          requested_by: userId,
          original_balance: bill.balance,
          original_final_due: bill.final_due,
          original_credit_balance: bill.credit_balance,
          original_status: bill.status,
        },
        select: this.closeRequestSelect,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new HttpException('A close request already exists for this bill', 409);
      }
      throw error;
    }

    await this.notifyManagersAboutCloseRequest({
      requestId: request.id,
      requesterId: userId,
      messId: bill.mess_id,
      messName: bill.mess.name,
      memberName: bill.member.name,
      month: bill.month,
      balance: this.toFixedNumber(bill.balance),
    });

    return request;
  }

  async findManagedCloseRequests(
    userId: string,
    role: string,
    query: BillCloseRequestFilterDto,
  ) {
    await this.verifyGeneratePermission(query.messId, userId, role);

    return this.prisma.monthlyBillCloseRequest.findMany({
      where: {
        mess_id: query.messId,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { requested_at: 'desc' },
      select: {
        ...this.closeRequestSelect,
        bill: {
          select: {
            id: true,
            month: true,
            balance: true,
            final_due: true,
            credit_balance: true,
          },
        },
        member: {
          select: { id: true, name: true, email: true, avatar_url: true },
        },
        mess: { select: { id: true, name: true } },
      },
    });
  }

  async reviewCloseRequest(
    requestId: string,
    reviewerId: string,
    role: string,
    dto: ReviewBillCloseRequestDto,
  ) {
    const request = await this.prisma.monthlyBillCloseRequest.findUnique({
      where: { id: requestId },
      include: {
        bill: true,
        member: { select: { name: true, email: true } },
        mess: { select: { name: true } },
      },
    });

    if (!request) throw new HttpException('Bill close request not found', 404);
    await this.verifyGeneratePermission(request.mess_id, reviewerId, role);
    await this.ensureActiveSubscription(request.mess_id, role);

    if (request.status !== RequestStatus.PENDING) {
      throw new HttpException('This close request has already been reviewed', 409);
    }

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.monthlyBillCloseRequest.updateMany({
        where: { id: requestId, status: RequestStatus.PENDING },
        data: {
          status: dto.status,
          review_note: dto.reviewNote?.trim() || null,
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
        },
      });
      if (claimed.count !== 1) {
        throw new HttpException('This close request has already been reviewed', 409);
      }

      if (dto.status === RequestStatus.APPROVED) {
        await tx.monthlyBill.update({
          where: { id: request.monthly_bill_id },
          data: {
            balance: 0,
            final_due: 0,
            credit_balance: 0,
            status: 'PAID',
          },
        });
      }
    });

    if (dto.status === RequestStatus.APPROVED) {
      await this.recalculateCarryForwardChain(
        request.mess_id,
        request.bill.month,
      );
    }

    await Promise.allSettled([
      this.notificationService.createForMess(
        reviewerId,
        request.mess_id,
        NotificationType.BILL_GENERATED,
        dto.status === RequestStatus.APPROVED
          ? 'Monthly calculation closed'
          : 'Monthly calculation close request rejected',
        dto.status === RequestStatus.APPROVED
          ? `${request.mess.name} approved your request. The closed balance is now zero and will not carry forward.`
          : `${request.mess.name} rejected your request to close the previous calculation.`,
        {
          closeRequestId: request.id,
          billId: request.monthly_bill_id,
          status: dto.status,
        },
        [request.member_id],
        '/monthly-bill',
        `bill-close-reviewed:${request.id}`,
      ),
    ]);

    return this.prisma.monthlyBillCloseRequest.findUnique({
      where: { id: requestId },
      select: this.closeRequestSelect,
    });
  }

  private async recalculateCarryForwardChain(messId: string, month: Date) {
    const currentMonth = currentDhakaMonth();
    let cursor = new Date(month);

    while (cursor.getTime() <= currentMonth.getTime()) {
      await this.recalculateMonthlyBills(messId, cursor);
      cursor = new Date(
        Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
      );
    }
  }

  private async notifyManagersAboutCloseRequest(input: {
    requestId: string;
    requesterId: string;
    messId: string;
    messName: string;
    memberName: string;
    month: Date;
    balance: number;
  }) {
    try {
      const managerIds =
        await this.notificationService.resolveMessManagerUserIds(input.messId);
      const managers = managerIds.length
        ? await this.prisma.user.findMany({
            where: { id: { in: managerIds }, is_active: true },
            select: { email: true, name: true },
          })
        : [];
      const monthLabel = input.month.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });

      await Promise.allSettled([
        this.notificationService.createForMess(
          input.requesterId,
          input.messId,
          NotificationType.BILL_GENERATED,
          'Previous calculation close request',
          `${input.memberName} requested to close the ${monthLabel} balance (${input.balance.toFixed(2)}).`,
          {
            closeRequestId: input.requestId,
            month: input.month.toISOString(),
            balance: input.balance,
          },
          managerIds,
          '/monthly-bill',
          `bill-close-requested:${input.requestId}`,
        ),
        ...managers.map((manager) =>
          sendMailer(
            manager.email,
            `Monthly calculation close request - ${input.messName}`,
            `<p>Hello ${escapeHtml(manager.name)},</p><p><strong>${escapeHtml(input.memberName)}</strong> requested to close the <strong>${escapeHtml(monthLabel)}</strong> calculation in ${escapeHtml(input.messName)}.</p><p>Original carry-forward balance: <strong>${escapeHtml(input.balance.toFixed(2))}</strong></p><p>Please review the pending request from the Monthly Bill page.</p>`,
          ),
        ),
      ]);
    } catch (error) {
      console.error('Failed to notify managers about bill close request', error);
    }
  }

  async findAll(
    query: BillFilterDto,
    additionalWhere?: Prisma.MonthlyBillWhereInput,
  ) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);

    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);

    const queryWhere = this.buildWhere(query);
    const where: Prisma.MonthlyBillWhereInput = additionalWhere
      ? { AND: [queryWhere, additionalWhere] }
      : queryWhere;

    const safeSortBy = sortBy === 'created_at' ? 'generated_at' : sortBy;

    const [total, bills] = await Promise.all([
      this.prisma.monthlyBill.count({ where }),
      this.prisma.monthlyBill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: sortOrder },
        select: this.billSelect,
      }),
    ]);

    return {
      data: bills,
      meta: buildMeta(total, page, limit),
    };
  }

  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: BillFilterDto,
  ) {
    if (role !== 'ADMIN') {
      const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
      if (!mess) throw new HttpException('Mess not found', 404);
      const membership = await this.prisma.messMembership.findUnique({
        where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
      });
      if (!membership?.is_active && mess.created_by !== userId) {
        throw new HttpException('Forbidden: Not a member of this mess', 403);
      }
    }

    return this.findAll(
      { ...query, messId },
      {
        member: {
          memberships: {
            some: { mess_id: messId, is_active: true },
          },
        },
      },
    );
  }

  async findMyBills(userId: string, query: BillFilterDto) {
    return this.findAll({ ...query, memberId: userId });
  }

  async findOne(id: string, userId: string, role: string) {
    const bill = await this.prisma.monthlyBill.findUnique({
      where: { id },
      select: this.billSelect,
    });

    if (!bill) throw new HttpException('Bill not found', 404);

    if (role !== 'ADMIN') {
      const mess = await this.prisma.mess.findUnique({
        where: { id: bill.mess.id },
      });
      const membership = await this.prisma.messMembership.findUnique({
        where: { mess_id_user_id: { mess_id: bill.mess.id, user_id: userId } },
      });
      if (!membership?.is_active && mess?.created_by !== userId) {
        throw new HttpException('Forbidden: Not a member of this mess', 403);
      }
    }

    return bill;
  }

  async updateStatus(
    id: string,
    userId: string,
    role: string,
    dto: UpdateBillStatusDto,
  ) {
    const bill = await this.prisma.monthlyBill.findUnique({ where: { id } });
    if (!bill) throw new HttpException('Bill not found', 404);

    if (role !== 'ADMIN') {
      const mess = await this.prisma.mess.findUnique({
        where: { id: bill.mess_id },
      });
      if (mess?.created_by !== userId) {
        throw new HttpException('Forbidden: Not your mess', 403);
      }
    }

    await this.ensureActiveSubscription(bill.mess_id, role);

    return this.prisma.monthlyBill.update({
      where: { id },
      data: { status: dto.status },
      select: this.billSelect,
    });
  }

  private buildWhere(query: BillFilterDto): Prisma.MonthlyBillWhereInput {
    const where: Prisma.MonthlyBillWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.memberId) where.member_id = query.memberId;
    if (query.status) where.status = query.status;
    if (query.month) {
      // Match the UTC normalization used in getBillMonthRange
      const monthStr = query.month.substring(0, 7);
      const [year, month] = monthStr.split('-').map(Number);
      where.month = new Date(Date.UTC(year, month - 1, 1));
    }
    return where;
  }
}
