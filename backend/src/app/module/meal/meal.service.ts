import { HttpException, Injectable } from '@nestjs/common';
import { CreateMealDto, MealFilterDto, UpdateMealDto } from './dto/meal.dto';
import { AttendanceStatus, MealName, MembershipRole, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MealService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyMessAccess(
    messId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    if (role === 'ADMIN') return;
    if (role === 'MANAGER' && mess.created_by === userId) return;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!membership?.is_active) {
      throw new HttpException(
        'Forbidden: You are not a member of this mess',
        403,
      );
    }
  }

  async create(userId: string, role: string, dto: CreateMealDto) {
    await this.verifyMessAccess(dto.messId, userId, role);

    const date = dto.date ? new Date(dto.date) : new Date();
    const mealName = dto.mealName ?? MealName.LUNCH;
    const meal = await this.prisma.meal.findFirst({
      where: { mess_id: dto.messId, name: mealName, scheduled_date: date },
    });

    const savedMeal = meal ?? await this.prisma.meal.create({
      data: {
        mess_id: dto.messId,
        created_by: userId,
        name: mealName,
        scheduled_date: date,
        status: 'CONFIRMED',
      },
    });

    if (savedMeal.is_locked && role === 'MEMBER') {
      throw new HttpException('Meal is locked after deadline', 400);
    }

    const targetMemberId = role === 'MEMBER' ? userId : (dto.memberId ?? userId);
    return this.prisma.mealAttendance.upsert({
      where: { meal_id_member_id: { meal_id: savedMeal.id, member_id: targetMemberId } },
      update: {
        status: dto.status ?? (dto.mealCount === 0 ? AttendanceStatus.OFF : AttendanceStatus.ON),
        guests: dto.guests ?? 0,
      },
      create: {
        meal_id: savedMeal.id,
        member_id: targetMemberId,
        status: dto.status ?? (dto.mealCount === 0 ? AttendanceStatus.OFF : AttendanceStatus.ON),
        guests: dto.guests ?? 0,
      },
      include: {
        meal: {
          include: {
            creator: { select: { id: true, name: true } },
            mess: { select: { id: true, name: true } },
          },
        },
        member: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(query: MealFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);

    const where = this.buildWhere(query);
    const [total, meals] = await Promise.all([
      this.prisma.meal.count({ where }),
      this.prisma.meal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: { select: { id: true, name: true } },
          mess: { select: { id: true, name: true } },
          attendances: {
            include: { member: { select: { id: true, name: true, email: true } } },
          },
        },
      }),
    ]);

    return {
      data: meals,
      meta: buildMeta(total, page, limit),
      totalMealCount: total,
    };
  }

  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: MealFilterDto,
  ) {
    await this.verifyMessAccess(messId, userId, role);
    return this.findAll({ ...query, messId });
  }

  async findOne(id: string, userId: string, role: string) {
    const meal = await this.prisma.meal.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        mess: { select: { id: true, name: true } },
        attendances: {
          include: { member: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!meal) throw new HttpException('Meal entry not found', 404);
    await this.verifyMessAccess(meal.mess_id, userId, role);
    return meal;
  }

  async update(id: string, userId: string, role: string, dto: UpdateMealDto) {
    const meal = await this.prisma.meal.findUnique({ where: { id } });
    if (!meal) throw new HttpException('Meal entry not found', 404);

    if (role === 'MEMBER' && meal.created_by !== userId) {
      throw new HttpException('Forbidden: Not your meal entry', 403);
    }

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: meal.mess_id, user_id: userId } },
    });
    if (role === 'MANAGER' && membership?.role !== MembershipRole.MANAGER) {
      const mess = await this.prisma.mess.findUnique({ where: { id: meal.mess_id } });
      if (mess?.created_by !== userId) throw new HttpException('Forbidden: Not your mess', 403);
    }

    const updatedMeal = await this.prisma.meal.update({
      where: { id },
      data: {
        scheduled_date: dto.date ? new Date(dto.date) : undefined,
        status: dto.mealStatus,
        is_locked: dto.mealStatus === 'LOCKED' ? true : undefined,
      },
      include: { creator: { select: { id: true, name: true } } },
    });
    if (dto.status || dto.guests !== undefined || dto.mealCount !== undefined) {
      await this.prisma.mealAttendance.upsert({
        where: { meal_id_member_id: { meal_id: id, member_id: userId } },
        update: {
          status: dto.status ?? (dto.mealCount === 0 ? AttendanceStatus.OFF : undefined),
          guests: dto.guests,
        },
        create: {
          meal_id: id,
          member_id: userId,
          status: dto.status ?? (dto.mealCount === 0 ? AttendanceStatus.OFF : AttendanceStatus.ON),
          guests: dto.guests ?? 0,
        },
      });
    }
    return updatedMeal;
  }

  async remove(id: string, userId: string, role: string) {
    const meal = await this.prisma.meal.findUnique({ where: { id } });
    if (!meal) throw new HttpException('Meal entry not found', 404);

    if (role === 'MEMBER' && meal.created_by !== userId) {
      throw new HttpException('Forbidden: Not your meal entry', 403);
    }

    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({
        where: { id: meal.mess_id },
      });
      if (mess?.created_by !== userId) {
        throw new HttpException('Forbidden: Not your mess', 403);
      }
    }

    await this.prisma.meal.delete({ where: { id } });
    return { message: 'Meal entry deleted successfully' };
  }

  async getMealSummaryByMess(
    messId: string,
    userId: string,
    role: string,
    startDate?: string,
    endDate?: string,
  ) {
    await this.verifyMessAccess(messId, userId, role);

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const members = await this.prisma.messMembership.findMany({
      where: { mess_id: messId, is_active: true },
      include: {
        user: { select: { id: true, name: true, avatar_url: true } },
      },
    });

    const summary = await Promise.all(
      members.map(async (member) => {
        const [mealCount, depositTotal] = await Promise.all([
          this.prisma.mealAttendance.count({
            where: {
              member_id: member.user_id,
              status: 'ON',
              meal: {
                mess_id: messId,
                ...(Object.keys(dateFilter).length
                  ? { scheduled_date: dateFilter }
                  : {}),
              },
            },
          }),
          this.prisma.deposit.aggregate({
            where: {
              mess_id: messId,
              member_id: member.user_id,
              ...(Object.keys(dateFilter).length
                ? { created_at: dateFilter }
                : {}),
            },
            _sum: { amount: true },
          }),
        ]);

        return {
          user: member.user,
          totalMeals: mealCount,
          totalDeposit: depositTotal._sum.amount ?? 0,
        };
      }),
    );

    const expenseTotal = await this.prisma.expense.aggregate({
      where: {
        mess_id: messId,
        ...(Object.keys(dateFilter).length ? { expense_date: dateFilter } : {}),
      },
      _sum: { amount: true },
    });

    const totalBazarCost = Number(expenseTotal._sum.amount ?? 0);
    const totalMeals = summary.reduce((sum, s) => sum + Number(s.totalMeals), 0);
    const mealRate = totalMeals > 0 ? totalBazarCost / totalMeals : 0;

    return {
      summary: summary.map((s) => ({
        ...s,
        mealCost: Number(s.totalMeals) * mealRate,
        balance: Number(s.totalDeposit) - Number(s.totalMeals) * mealRate,
      })),
      totalBazarCost,
      totalMeals,
      mealRate: parseFloat(mealRate.toFixed(2)),
    };
  }

  private buildWhere(query: MealFilterDto): Prisma.MealWhereInput {
    const where: Prisma.MealWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.userId) where.created_by = query.userId;
    if (query.startDate || query.endDate) {
      where.scheduled_date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }
    return where;
  }
}
