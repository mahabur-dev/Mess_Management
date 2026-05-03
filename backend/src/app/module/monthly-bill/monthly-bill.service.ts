import { HttpException, Injectable } from '@nestjs/common';
import {
  BillFilterDto,
  GenerateBillDto,
  UpdateBillStatusDto,
} from './dto/monthly-bill.dto';
import { BillStatus, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class MonthlyBillService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly billSelect = {
    id: true,
    month: true,
    total_meals: true,
    meal_charge: true,
    utility_share: true,
    deposit_total: true,
    balance: true,
    status: true,
    generated_at: true,
    mess: { select: { id: true, name: true } },
    member: { select: { id: true, name: true, email: true } },
  } as const;

  async generate(managerId: string, role: string, dto: GenerateBillDto) {
    if (role !== 'ADMIN') {
      const mess = await this.prisma.mess.findUnique({
        where: { id: dto.messId },
      });
      if (!mess) throw new HttpException('Mess not found', 404);
      if (mess.created_by !== managerId) {
        throw new HttpException('Forbidden: Not your mess', 403);
      }
    }

    const month = new Date(dto.month);
    const nextMonth = new Date(month);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const activeMembers = await this.prisma.messMembership.findMany({
      where: { mess_id: dto.messId, is_active: true },
      select: { user_id: true },
    });

    if (!activeMembers.length) {
      throw new HttpException('No active members in this mess', 400);
    }

    const [totalExpenses, mealAttendances] = await Promise.all([
      this.prisma.expense.aggregate({
        where: {
          mess_id: dto.messId,
          expense_date: { gte: month, lt: nextMonth },
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
    const totalExpenseAmount = Number(totalExpenses._sum.amount ?? 0);
    const perMealRate = totalMeals > 0 ? totalExpenseAmount / totalMeals : 0;
    const utilityPerMember =
      totalExpenseAmount / activeMembers.length / activeMembers.length;

    const bills = await Promise.all(
      activeMembers.map(async ({ user_id }) => {
        const memberMeals = mealCountByUser[user_id] ?? 0;
        const mealCharge = memberMeals * perMealRate;

        const depositAgg = await this.prisma.deposit.aggregate({
          where: {
            mess_id: dto.messId,
            member_id: user_id,
            created_at: { gte: month, lt: nextMonth },
          },
          _sum: { amount: true },
        });

        const depositTotal = Number(depositAgg._sum.amount ?? 0);
        const balance = depositTotal - mealCharge - utilityPerMember;

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
            meal_charge: mealCharge,
            utility_share: utilityPerMember,
            deposit_total: depositTotal,
            balance,
          },
          create: {
            mess_id: dto.messId,
            member_id: user_id,
            month,
            total_meals: memberMeals,
            meal_charge: mealCharge,
            utility_share: utilityPerMember,
            deposit_total: depositTotal,
            balance,
            status: BillStatus.PENDING,
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
