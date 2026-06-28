import { HttpException, Injectable } from '@nestjs/common';
import {
  BillFilterDto,
  GenerateBillDto,
  UpdateBillStatusDto,
} from './dto/monthly-bill.dto';
import { AttendanceStatus, BillStatus, ExpenseCategory, MealName, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';

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

@Injectable()
export class MonthlyBillService {
  constructor(private readonly prisma: PrismaService) { }

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
    prev_balance: true,
    balance: true,
    status: true,
    due_date: true,
    generated_at: true,
    mess: { select: { id: true, name: true } },
    member: { select: { id: true, name: true, email: true } },
  } as const;

  private getBillMonthRange(monthInput: string | Date) {
    // Normalize to first day of month consistently in UTC to avoid timezone mismatches
    const month = new Date(monthInput)
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const utcMonth = new Date(Date.UTC(year, monthIndex, 1))
    const nextMonth = new Date(Date.UTC(year, monthIndex + 1, 1))
    return { month: utcMonth, nextMonth }
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

    if (!roomConfig || typeof roomConfig !== 'object' || Array.isArray(roomConfig)) {
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
    if (role === 'ADMIN') return;

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
        is_active: true,
      },
      select: {
        user_id: true,
        monthly_rent: true,
        room_no: true,
      },
    });

    if (!activeMembers.length) {
      throw new HttpException('No active members in this mess', 400);
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
    ] = await Promise.all([
      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          expense_date: {
            gte: month,
            lt: nextMonth,
          },
          category: {
            in: [ExpenseCategory.FOOD, ExpenseCategory.GROCERY],
          },
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          expense_date: {
            gte: month,
            lt: nextMonth,
          },
          category: ExpenseCategory.ELECTRICITY,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          expense_date: {
            gte: month,
            lt: nextMonth,
          },
          category: ExpenseCategory.GAS,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          expense_date: {
            gte: month,
            lt: nextMonth,
          },
          category: ExpenseCategory.WIFI,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          expense_date: {
            gte: month,
            lt: nextMonth,
          },
          category: ExpenseCategory.CLEANER,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          expense_date: {
            gte: month,
            lt: nextMonth,
          },
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
              ExpenseCategory.GAS
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
          created_at: {
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
          created_at: {
            gte: month,
            lt: nextMonth,
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

    const totalFoodExpense = this.toFixedNumber(foodExpenses._sum.amount);

    const perMealRate =
      totalMeals > 0 ? totalFoodExpense / totalMeals : 0;

    const depositByUser = this.makeAmountMap(depositGroups);
    const paymentByUser = this.makeAmountMap(paymentGroups);

    const splitByMember = (value: unknown) =>
      activeMembers.length > 0
        ? this.toFixedNumber(Number(value ?? 0) / activeMembers.length)
        : 0;

    const electricityShare = splitByMember(
      electricityExpenses._sum.amount,
    );
    const gasShare = splitByMember(gasExpenses._sum.amount);
    const wifiShare = splitByMember(wifiExpenses._sum.amount);
    const cleanerShare = splitByMember(cleanerExpenses._sum.amount);
    const utilityExpensesAmount = splitByMember(utilityExpenses._sum.amount);
    const utilityPerMember = this.toFixedNumber(utilityExpensesAmount);
    // console.log("perMember : ", utilityPerMember);

    // Fetch previous month's bills to get balances carried forward
    const prevMonthStart = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1))
    const prevBills = await this.prisma.monthlyBill.findMany({
      where: {
        mess_id: messId,
        month: prevMonthStart,
        member_id: { in: activeMembers.map(m => m.user_id) },
      },
      select: { member_id: true, balance: true },
    })
    const prevBalanceByMember: Record<string, number> = {}
    for (const pb of prevBills) {
      prevBalanceByMember[pb.member_id] = this.toFixedNumber(pb.balance)
    }

    const dueDate = new Date(month);
    dueDate.setDate(mess.payment_deadline_day ?? 10);

    const billWrites: Prisma.MonthlyBillUpsertArgs[] = activeMembers.map(({ user_id, monthly_rent, room_no }) => {
      const prevBalance = prevBalanceByMember[user_id] ?? 0;
      const memberMeals = mealCountByUser[user_id] ?? 0;

      const foodBill = this.toFixedNumber(memberMeals * perMealRate);
      // console.log("food bill : ", foodBill)
      const seatRent = this.calculateSeatRent(
        rooms,
        room_no,
        monthly_rent,
        mess.monthly_rent,
      );

      const depositTotal = depositByUser[user_id] ?? 0;
      const paidAmount = paymentByUser[user_id] ?? 0;

      // deposit_total already includes auto-created deposits from PERSONAL expenses
      const effectiveDepositTotal = this.toFixedNumber(depositTotal);
      const totalPaid = this.toFixedNumber(effectiveDepositTotal + paidAmount);

      // Include previous month's balance in the current month's calculation
      // prevBalance from DB: Positive (+) = due/baki from last month → gets added to current costs
      //                     Negative (-) = extra/overpaid from last month → gets subtracted from costs (credit)
      // Formula: due = max(0, totalCost - totalPaid + prevBalance)
      // When prevBalance is +500 (due): costs - payments + 500 → increases due ✓
      // When prevBalance is -200 (extra): costs - payments - 200 → decreases due (credit) ✓

      const rawDue =
        foodBill + seatRent + utilityPerMember - totalPaid + prevBalance;

      const finalDue = this.toFixedNumber(Math.max(rawDue, 0));
      // balance stores the actual net position (can be negative for overpayments)
      // This ensures prev_balance carries forward properly as credit
      const balance = this.toFixedNumber(rawDue);

      const billStatus =
        finalDue <= 0
          ? BillStatus.PAID
          : totalPaid > 0
            ? BillStatus.PARTIAL
            : BillStatus.PENDING;

      const billData = {
        total_meals: memberMeals,
        meal_charge: foodBill,
        food_bill: foodBill,
        seat_rent: seatRent,
        electricity_bill: electricityShare,
        gas_bill: gasShare,
        wifi_bill: wifiShare,
        cleaner_bill: cleanerShare,
        extra_cost: utilityExpensesAmount,
        utility_share: utilityPerMember,
        deposit_total: depositTotal,
        paid_amount: paidAmount,
        prev_balance: prevBalance,
        final_due: finalDue,
        balance,
        due_date: dueDate,
        status: billStatus,
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
    });

    return this.prisma.$transaction(
      async (tx) => {
        type MonthlyBillResult = Awaited<ReturnType<typeof tx.monthlyBill.upsert>>;
        const bills: MonthlyBillResult[] = [];

        for (const billWrite of billWrites) {
          bills.push(await tx.monthlyBill.upsert(billWrite));
        }

        return bills;
      },
      {
        maxWait: 5_000,
        timeout: 20_000,
      },
    );
  }

  async findAll(query: BillFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);

    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);

    const where = this.buildWhere(query);

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

    // Auto-recalculate bills when fetching for a specific mess to ensure utility costs are current
    if (query.month) {
      // Parse YYYY-MM or YYYY-MM-DD consistently to first day of month in UTC
      const monthStr = query.month.substring(0, 7)
      const [year, month] = monthStr.split('-').map(Number)
      const billMonth = new Date(Date.UTC(year, month - 1, 1))
      await this.recalculateMonthlyBills(messId, billMonth)
    }

    return this.findAll({ ...query, messId });
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
      const monthStr = query.month.substring(0, 7)
      const [year, month] = monthStr.split('-').map(Number)
      where.month = new Date(Date.UTC(year, month - 1, 1))
    }
    return where;
  }
}
