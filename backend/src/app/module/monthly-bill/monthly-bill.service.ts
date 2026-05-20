import { HttpException, Injectable } from '@nestjs/common';
import {
  BillFilterDto,
  GenerateBillDto,
  UpdateBillStatusDto,
} from './dto/monthly-bill.dto';
import { BillStatus, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MonthlyBillService {
  constructor(private readonly prisma: PrismaService) {}

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

  async generate(managerId: string, role: string, dto: GenerateBillDto) {
    const mess = await this.prisma.mess.findUnique({ where: { id: dto.messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (role !== 'ADMIN') {
      const membership = await this.prisma.messMembership.findUnique({
        where: { mess_id_user_id: { mess_id: dto.messId, user_id: managerId } },
      });
      if (mess.created_by !== managerId && !(membership?.is_active && membership.role === 'MANAGER')) {
        throw new HttpException('Forbidden: Not your mess', 403);
      }
    }

    const month = new Date(dto.month);
    const nextMonth = new Date(month);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const activeMembers = await this.prisma.messMembership.findMany({
      where: { mess_id: dto.messId, is_active: true },
      select: { user_id: true, monthly_rent: true },
    });

    if (!activeMembers.length) {
      throw new HttpException('No active members in this mess', 400);
    }

    const [totalExpenses, mealAttendances] = await Promise.all([
      this.prisma.expense.aggregate({
        where: {
          mess_id: dto.messId,
          expense_date: { gte: month, lt: nextMonth },
          category: { in: ['GROCERY', 'FOOD'] },
        },
        _sum: { amount: true },
      }),
      this.prisma.mealAttendance.findMany({
        where: {
          // meal: {
          //   mess_id: dto.messId,
          //   date: { gte: month, lt: nextMonth },
          // },
          meal: {
            mess_id: dto.messId,
            scheduled_date: { gte: month, lt: nextMonth },
          },
          status: 'ON',
        },
        // select: { user_id: true },
        select: { member_id: true },
      }),
    ]);

    const mealCountByUser: Record<string, number> = {};
    for (const att of mealAttendances) {
      // mealCountByUser[att.user_id] = (mealCountByUser[att.user_id] ?? 0) + 1;
      mealCountByUser[att.member_id] = (mealCountByUser[att.member_id] ?? 0) + 1;
    }

    const totalMeals = mealAttendances.length;
    const totalFoodExpense = Number(totalExpenses._sum.amount ?? 0);
    const perMealRate = totalMeals > 0 ? totalFoodExpense / totalMeals : 0;
    const split = (value: unknown) => Number(value ?? 0) / activeMembers.length;
    const electricityShare = split(mess.electricity_bill);
    const gasShare = split(mess.gas_bill);
    const wifiShare = split(mess.wifi_bill);
    const cleanerShare = split(mess.cleaner_bill);
    const extraShare = split(mess.extra_cost);
    const utilityPerMember = electricityShare + gasShare + wifiShare + cleanerShare + extraShare;
    const dueDate = new Date(month);
    dueDate.setDate(mess.payment_deadline_day ?? 10);

    const bills = await Promise.all(
      activeMembers.map(async ({ user_id, monthly_rent }) => {
        const memberMeals = mealCountByUser[user_id] ?? 0;
        const foodBill = memberMeals * perMealRate;
        const seatRent = Number(monthly_rent ?? mess.monthly_rent ?? 0);

        const depositAgg = await this.prisma.deposit.aggregate({
          where: {
            mess_id: dto.messId,
            member_id: user_id,
            created_at: { gte: month, lt: nextMonth },
          },
          _sum: { amount: true },
        });

        const depositTotal = Number(depositAgg._sum.amount ?? 0);
        const finalDue = foodBill + seatRent + utilityPerMember - depositTotal;
        const balance = Math.max(finalDue, 0);
        const billStatus = balance <= 0 ? BillStatus.PAID : depositTotal > 0 ? BillStatus.PARTIAL : BillStatus.PENDING;

        return this.prisma.monthlyBill.upsert({
          where: {
            mess_id_member_id_month: {
              mess_id: dto.messId,
              member_id: user_id,
              month,
            },
          },
          update: {
            total_meals: memberMeals,
            meal_charge: foodBill,
            food_bill: foodBill,
            seat_rent: seatRent,
            electricity_bill: electricityShare,
            gas_bill: gasShare,
            wifi_bill: wifiShare,
            cleaner_bill: cleanerShare,
            extra_cost: extraShare,
            utility_share: utilityPerMember,
            deposit_total: depositTotal,
            paid_amount: depositTotal,
            final_due: Math.max(finalDue, 0),
            balance,
            due_date: dueDate,
            status: billStatus,
          },
          create: {
            mess_id: dto.messId,
            member_id: user_id,
            month,
            total_meals: memberMeals,
            meal_charge: foodBill,
            food_bill: foodBill,
            seat_rent: seatRent,
            electricity_bill: electricityShare,
            gas_bill: gasShare,
            wifi_bill: wifiShare,
            cleaner_bill: cleanerShare,
            extra_cost: extraShare,
            utility_share: utilityPerMember,
            deposit_total: depositTotal,
            paid_amount: depositTotal,
            final_due: Math.max(finalDue, 0),
            balance,
            due_date: dueDate,
            status: billStatus,
          },
          select: this.billSelect,
        });
      }),
    );

    return bills;
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

    const [total, bills] = await Promise.all([
      this.prisma.monthlyBill.count({ where }),
      this.prisma.monthlyBill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
