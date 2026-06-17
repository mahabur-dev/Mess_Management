import { HttpException, Injectable } from '@nestjs/common';
import {
  BillFilterDto,
  GenerateBillDto,
  UpdateBillStatusDto,
} from './dto/monthly-bill.dto';
import { BillStatus, ExpenseCategory, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';

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
    balance: true,
    status: true,
    due_date: true,
    generated_at: true,
    mess: { select: { id: true, name: true } },
    member: { select: { id: true, name: true, email: true } },
  } as const;

  private getBillMonthRange(monthInput: string | Date) {
    const month = new Date(monthInput);
    month.setDate(1);
    month.setHours(0, 0, 0, 0);

    const nextMonth = new Date(month);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return { month, nextMonth };
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

  async generate(managerId: string, role: string, dto: GenerateBillDto) {
    await this.verifyGeneratePermission(dto.messId, managerId, role);

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
      extraExpenses,
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
      const mealCount = 1 + Number(attendance.guests ?? 0);

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
    const extraCostShare = splitByMember(extraExpenses._sum.amount);
    const utilityPerMember = this.toFixedNumber(
      electricityShare + gasShare + wifiShare + cleanerShare + extraCostShare,
    );

    const dueDate = new Date(month);
    dueDate.setDate(mess.payment_deadline_day ?? 10);

    const billQueries = activeMembers.map(({ user_id, monthly_rent, room_no }) => {
      const memberMeals = mealCountByUser[user_id] ?? 0;

      const foodBill = this.toFixedNumber(memberMeals * perMealRate);
      const seatRent = this.calculateSeatRent(
        rooms,
        room_no,
        monthly_rent,
        mess.monthly_rent,
      );

      const depositTotal = depositByUser[user_id] ?? 0;
      const paidAmount = paymentByUser[user_id] ?? 0;

      const totalPaid = this.toFixedNumber(depositTotal + paidAmount);

      const rawDue =
        foodBill + seatRent + utilityPerMember - totalPaid;

      const finalDue = this.toFixedNumber(Math.max(rawDue, 0));
      const balance = finalDue;

      const billStatus =
        balance <= 0
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
        extra_cost: extraCostShare,
        utility_share: utilityPerMember,
        deposit_total: depositTotal,
        paid_amount: paidAmount,
        final_due: finalDue,
        balance,
        due_date: dueDate,
        status: billStatus,
      };

      return this.prisma.monthlyBill.upsert({
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
      });
    });

    return this.prisma.$transaction(billQueries);
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
    if (query.month) where.month = new Date(query.month);
    return where;
  }
}
