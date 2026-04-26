import { HttpException, Injectable } from '@nestjs/common';
import { CreateMealDto, MealFilterDto, UpdateMealDto } from './dto/meal.dto';
import type { MealWhereInput } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';

@Injectable()
export class MealService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────
  // Verify mess access helper
  // ─────────────────────────────────────────
  private async verifyMessAccess(
    messId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    if (role === 'ADMIN') return;
    if (role === 'MANAGER' && mess.managerId === userId) return;

    const membership = await this.prisma.messMember.findUnique({
      where: { messId_userId: { messId, userId } },
    });
    if (!membership)
      throw new HttpException('Forbidden: You are not a member of this mess', 403);
  }

  // ─────────────────────────────────────────
  // Add meal entry
  // ─────────────────────────────────────────
  async create(userId: string, role: string, dto: CreateMealDto) {
    await this.verifyMessAccess(dto.messId, userId, role);

    const meal = await this.prisma.meal.create({
      data: {
        messId: dto.messId,
        userId,
        mealCount: dto.mealCount,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
      include: {
        user: { select: { id: true, name: true } },
        mess: { select: { id: true, messName: true } },
      },
    });

    return meal;
  }

  // ─────────────────────────────────────────
  // Get all meals (Admin)
  // ─────────────────────────────────────────
  async findAll(query: MealFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(
      paginationOptions as any,
    );

    const where: MealWhereInput = {};
    if (query.messId) where.messId = query.messId;
    if (query.userId) where.userId = query.userId;
    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    const [total, meals, totalMeals] = await Promise.all([
      this.prisma.meal.count({ where }),
      this.prisma.meal.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { id: true, name: true } },
          mess: { select: { id: true, messName: true } },
        },
      }),
      this.prisma.meal.aggregate({ where, _sum: { mealCount: true } }),
    ]);

    return {
      data: meals,
      meta: buildMeta(total, page, limit),
      totalMealCount: totalMeals._sum.mealCount ?? 0,
    };
  }

  // ─────────────────────────────────────────
  // Get meals by mess ID
  // ─────────────────────────────────────────
  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: MealFilterDto,
  ) {
    await this.verifyMessAccess(messId, userId, role);

    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(
      paginationOptions as any,
    );

    const where: MealWhereInput = { messId };
    if (query.userId) where.userId = query.userId;
    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    const [total, meals, totalMeals] = await Promise.all([
      this.prisma.meal.count({ where }),
      this.prisma.meal.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
        },
      }),
      this.prisma.meal.aggregate({ where, _sum: { mealCount: true } }),
    ]);

    return {
      data: meals,
      meta: buildMeta(total, page, limit),
      totalMealCount: totalMeals._sum.mealCount ?? 0,
    };
  }

  // ─────────────────────────────────────────
  // Get single meal
  // ─────────────────────────────────────────
  async findOne(id: string, userId: string, role: string) {
    const meal = await this.prisma.meal.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        mess: { select: { id: true, messName: true } },
      },
    });

    if (!meal) throw new HttpException('Meal entry not found', 404);
    await this.verifyMessAccess(meal.messId, userId, role);
    return meal;
  }

  // ─────────────────────────────────────────
  // Update meal (own or manager/admin)
  // ─────────────────────────────────────────
  async update(id: string, userId: string, role: string, dto: UpdateMealDto) {
    const meal = await this.prisma.meal.findUnique({ where: { id } });
    if (!meal) throw new HttpException('Meal entry not found', 404);

    if (role === 'MEMBER' && meal.userId !== userId) {
      throw new HttpException('Forbidden: Not your meal entry', 403);
    }

    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({ where: { id: meal.messId } });
      if (mess?.managerId !== userId)
        throw new HttpException('Forbidden: Not your mess', 403);
    }

    const updated = await this.prisma.meal.update({
      where: { id },
      data: {
        mealCount: dto.mealCount,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return updated;
  }

  // ─────────────────────────────────────────
  // Delete meal
  // ─────────────────────────────────────────
  async remove(id: string, userId: string, role: string) {
    const meal = await this.prisma.meal.findUnique({ where: { id } });
    if (!meal) throw new HttpException('Meal entry not found', 404);

    if (role === 'MEMBER' && meal.userId !== userId) {
      throw new HttpException('Forbidden: Not your meal entry', 403);
    }

    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({ where: { id: meal.messId } });
      if (mess?.managerId !== userId)
        throw new HttpException('Forbidden: Not your mess', 403);
    }

    await this.prisma.meal.delete({ where: { id } });
    return { message: 'Meal entry deleted successfully' };
  }

  // ─────────────────────────────────────────
  // Get meal summary per user in a mess (for meal-rate calculation)
  // ─────────────────────────────────────────
  async getMealSummaryByMess(
    messId: string,
    userId: string,
    role: string,
    startDate?: string,
    endDate?: string,
  ) {
    await this.verifyMessAccess(messId, userId, role);

    const dateFilter: MealWhereInput['date'] = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const members = await this.prisma.messMember.findMany({
      where: { messId },
      include: {
        user: {
          select: { id: true, name: true, profileImage: true },
        },
      },
    });

    const summary = await Promise.all(
      members.map(async (member) => {
        const result = await this.prisma.meal.aggregate({
          where: {
            messId,
            userId: member.userId,
            ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
          },
          _sum: { mealCount: true },
        });

        const depositTotal = await this.prisma.deposit.aggregate({
          where: {
            messId,
            userId: member.userId,
            ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
          },
          _sum: { amount: true },
        });

        return {
          user: member.user,
          totalMeals: result._sum.mealCount ?? 0,
          totalDeposit: depositTotal._sum.amount ?? 0,
        };
      }),
    );

    // Total bazar cost for the mess in this period
    const bazarTotal = await this.prisma.bazar.aggregate({
      where: {
        messId,
        ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
      },
      _sum: { totalPrice: true },
    });

    const totalBazarCost = Number(bazarTotal._sum.totalPrice ?? 0);
    const totalMeals = summary.reduce(
      (sum, s) => sum + Number(s.totalMeals),
      0,
    );
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
}