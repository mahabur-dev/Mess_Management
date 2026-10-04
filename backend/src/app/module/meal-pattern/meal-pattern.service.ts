import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MealAttendanceSource, MealName, MealPatternStatus, MealPatternType, MealStatus, MembershipRole, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateMealPatternDto,
  UpdateMealPatternDto,
} from './dto/meal-pattern.dto';
import {
  dateKey,
  normalizeSchedule,
  parseDate,
  scheduleForDate,
} from './meal-pattern.policy';
import {
  getDhakaDateKey,
  getMealBaseValue,
  MEAL_TIME_ZONE,
  parseMealDate,
  shiftDateKey,
} from '../meal/meal-policy';
import { MonthlyBillReconciliationService } from '../monthly-bill/monthly-bill-reconciliation.service';
import config from 'src/app/config';
import { acquireMealMonthLocks } from '../meal/meal-concurrency';

const DAY_MS = 86_400_000;
const patternInclude = {
  membership: { include: { user: { select: { id: true, name: true, email: true } }, mess: { select: { id: true, name: true, created_by: true } } } },
  creator: { select: { id: true, name: true, email: true } },
} satisfies Prisma.MealPatternInclude;

@Injectable()
export class MealPatternService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billReconciliation: MonthlyBillReconciliationService,
  ) {}

  async create(actorId: string, role: string, dto: CreateMealPatternDto) {
    const membership = await this.getMembership(dto.membershipId);
    await this.assertAccess(actorId, role, membership, true);
    await this.ensureActiveSubscription(membership.mess_id, role);
    const start = parseDate(dto.startDate);
    const end = dto.endDate ? parseDate(dto.endDate) : null;
    if (end && end < start) throw new ConflictException('endDate must be on or after startDate');
    const schedule = normalizeSchedule(dto.patternType, dto.dailySchedule, dto.weeklySchedule);
    const activate = dto.activate !== false;
    let replacedPatternId: string | undefined;
    const pattern = await this.prisma.$transaction(async (tx) => {
      const latest = await tx.mealPattern.findFirst({ where: { membership_id: membership.id }, orderBy: { version: 'desc' } });
      const active = await tx.mealPattern.findFirst({ where: { membership_id: membership.id, status: MealPatternStatus.ACTIVE } });
      if (activate && active) {
        replacedPatternId = active.id;
        const previousEnd = new Date(start.getTime() - 86400000);
        await tx.mealPattern.update({ where: { id: active.id }, data: { end_date: previousEnd, status: MealPatternStatus.ENDED } });
      }
      return tx.mealPattern.create({
        data: { series_id: latest?.series_id ?? randomUUID(), version: (latest?.version ?? 0) + 1, membership_id: membership.id, pattern_type: dto.patternType, status: activate ? MealPatternStatus.ACTIVE : MealPatternStatus.DRAFT, start_date: start, end_date: end, daily_schedule: schedule.dailySchedule ?? Prisma.JsonNull, weekly_schedule: schedule.weeklySchedule ?? Prisma.JsonNull, created_by: actorId },
        include: patternInclude,
      });
    });
    if (activate) {
      if (replacedPatternId) await this.removeFuturePatternAttendances({ id: replacedPatternId, membership });
      await this.generateActivationMeals(pattern);
    }
    return pattern;
  }

  async findMine(actorId: string, role: string, membershipId?: string) {
    if (membershipId) {
      const membership = await this.getMembership(membershipId);
      await this.assertAccess(actorId, role, membership, false);
      return this.prisma.mealPattern.findMany({ where: { membership_id: membership.id }, include: patternInclude, orderBy: [{ membership_id: 'asc' }, { version: 'desc' }] });
    }
    return this.prisma.mealPattern.findMany({
      where: { membership: { user_id: actorId, is_active: true } },
      include: patternInclude,
      orderBy: [{ membership_id: 'asc' }, { version: 'desc' }],
    });
  }

  /** Returns every active member's pattern history in one query for a mess manager. */
  async findByMess(actorId: string, role: string, messId: string) {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId }, select: { id: true, created_by: true } });
    if (!mess) throw new NotFoundException('Mess not found');
    if (role !== 'ADMIN' && mess.created_by !== actorId) {
      const actorMembership = await this.prisma.messMembership.findUnique({
        where: { mess_id_user_id: { mess_id: messId, user_id: actorId } },
        select: { is_active: true, role: true },
      });
      if (!actorMembership?.is_active || actorMembership.role !== MembershipRole.MANAGER) {
        throw new ForbiddenException('Only a mess manager can view all meal patterns');
      }
    }
    return this.prisma.mealPattern.findMany({
      where: { membership: { mess_id: messId, is_active: true } },
      include: patternInclude,
      orderBy: [{ membership_id: 'asc' }, { version: 'desc' }],
    });
  }

  async findOne(id: string, actorId: string, role: string) {
    const pattern = await this.prisma.mealPattern.findUnique({ where: { id }, include: patternInclude });
    if (!pattern) throw new NotFoundException('Meal pattern not found');
    await this.assertAccess(actorId, role, pattern.membership, false);
    return pattern;
  }

  async update(id: string, actorId: string, role: string, dto: UpdateMealPatternDto) {
    const current = await this.prisma.mealPattern.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Meal pattern not found');
    const membership = await this.getMembership(current.membership_id);
    await this.assertAccess(actorId, role, membership, true);
    await this.ensureActiveSubscription(membership.mess_id, role);
    if (current.status === MealPatternStatus.CANCELLED || current.status === MealPatternStatus.ENDED) throw new ConflictException('Only an active, paused, or draft pattern can be changed');
    const type = dto.patternType ?? current.pattern_type;
    const schedule = normalizeSchedule(type, dto.dailySchedule ?? current.daily_schedule, dto.weeklySchedule ?? current.weekly_schedule);
    const start = dto.startDate ? parseDate(dto.startDate) : current.start_date;
    const end = dto.endDate === undefined ? current.end_date : dto.endDate ? parseDate(dto.endDate) : null;
    if (end && end < start) throw new ConflictException('endDate must be on or after startDate');
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.mealPattern.update({ where: { id }, data: { status: MealPatternStatus.ENDED, end_date: new Date(start.getTime() - 86400000) } });
      return tx.mealPattern.create({ data: { series_id: current.series_id, version: current.version + 1, membership_id: current.membership_id, pattern_type: type, status: current.status, start_date: start, end_date: end, daily_schedule: schedule.dailySchedule ?? Prisma.JsonNull, weekly_schedule: schedule.weeklySchedule ?? Prisma.JsonNull, created_by: actorId }, include: patternInclude });
    });
    if (current.status === MealPatternStatus.ACTIVE) {
      await this.removeFuturePatternAttendances({ id: current.id, membership });
      await this.generateActivationMeals(updated);
    }
    return updated;
  }

  async changeStatus(id: string, actorId: string, role: string, status: MealPatternStatus) {
    const pattern = await this.prisma.mealPattern.findUnique({ where: { id }, include: { membership: { include: { mess: true } } } });
    if (!pattern) throw new NotFoundException('Meal pattern not found');
    await this.assertAccess(actorId, role, pattern.membership, true);
    await this.ensureActiveSubscription(pattern.membership.mess_id, role);
    const replacedPatterns = status === MealPatternStatus.ACTIVE
      ? await this.prisma.mealPattern.findMany({
        where: { membership_id: pattern.membership_id, status: MealPatternStatus.ACTIVE, id: { not: id } },
        include: { membership: { include: { mess: true } } },
      })
      : [];
    if (status === MealPatternStatus.ACTIVE) {
      await this.prisma.$transaction(async (tx) => {
        await tx.mealPattern.updateMany({ where: { membership_id: pattern.membership_id, status: MealPatternStatus.ACTIVE, id: { not: id } }, data: { status: MealPatternStatus.ENDED, end_date: new Date(pattern.start_date.getTime() - 86400000) } });
        await tx.mealPattern.update({ where: { id }, data: { status } });
      });
    } else await this.prisma.mealPattern.update({ where: { id }, data: { status } });
    const updated = await this.findOne(id, actorId, role);
    if (status === MealPatternStatus.ACTIVE) {
      for (const replacedPattern of replacedPatterns) await this.removeFuturePatternAttendances(replacedPattern);
      await this.generateActivationMeals(updated);
    } else if (status === MealPatternStatus.PAUSED || status === MealPatternStatus.CANCELLED || status === MealPatternStatus.ENDED) {
      await this.removeFuturePatternAttendances(pattern);
    }
    return updated;
  }

  @Cron('1 0 * * *', { timeZone: MEAL_TIME_ZONE })
  async generateUpcomingMeals() {
    const today = new Date(
      `${new Intl.DateTimeFormat('en-CA', { timeZone: MEAL_TIME_ZONE }).format(new Date())}T00:00:00.000Z`,
    );
    const targetDate = new Date(today.getTime() + DAY_MS);
    const patterns = await this.prisma.mealPattern.findMany({
      where: {
        status: MealPatternStatus.ACTIVE,
        start_date: { lte: targetDate },
        OR: [{ end_date: null }, { end_date: { gte: targetDate } }],
        membership: { is_active: true },
      },
      include: { membership: true },
    });
    const affectedMessIds = new Set<string>();
    for (const pattern of patterns) {
      const changed = await this.generateDate(pattern, targetDate);
      if (changed) affectedMessIds.add(pattern.membership.mess_id);
    }
    for (const messId of affectedMessIds) {
      await this.billReconciliation.reconcile(messId, targetDate);
    }
  }

  private async generateDate(pattern: any, scheduledDate: Date) {
    const schedule = scheduleForDate(pattern, scheduledDate);
    let changed = false;
    for (const mealName of Object.values(MealName)) {
      const attendanceChanged = await this.prisma.$transaction(async (tx) => {
        await acquireMealMonthLocks(tx, pattern.membership.mess_id, [
          dateKey(scheduledDate),
        ]);
        const scheduledQuantity = schedule[mealName];
        const existingMeal = await tx.meal.findUnique({ where: { mess_id_name_scheduled_date: { mess_id: pattern.membership.mess_id, name: mealName, scheduled_date: scheduledDate } } });
        if (scheduledQuantity <= 0) {
          if (!existingMeal || existingMeal.is_locked || existingMeal.status === MealStatus.LOCKED || existingMeal.status === MealStatus.CANCELLED) return false;
          const existing = await tx.mealAttendance.findUnique({ where: { meal_id_member_id: { meal_id: existingMeal.id, member_id: pattern.membership.user_id } } });
          if (existing?.source !== MealAttendanceSource.PATTERN) return false;
          await tx.mealAttendance.delete({ where: { id: existing.id } });
          return true;
        }
        const meal = existingMeal ?? await tx.meal.create({ data: { mess_id: pattern.membership.mess_id, name: mealName, scheduled_date: scheduledDate, created_by: pattern.created_by, status: 'CONFIRMED' } });
        if (meal.is_locked || meal.status === 'LOCKED' || meal.status === 'CANCELLED') return false;
        const guests = Number((scheduledQuantity - getMealBaseValue(mealName)).toFixed(2));
        const existing = await tx.mealAttendance.findUnique({ where: { meal_id_member_id: { meal_id: meal.id, member_id: pattern.membership.user_id } } });
        if (existing?.source === MealAttendanceSource.PATTERN) {
          await tx.mealAttendance.update({ where: { id: existing.id }, data: { status: 'ON', guests, pattern_id: pattern.id } });
          return true;
        } else if (!existing) {
          await tx.mealAttendance.create({ data: { meal_id: meal.id, member_id: pattern.membership.user_id, status: 'ON', guests, source: MealAttendanceSource.PATTERN, pattern_id: pattern.id } });
          return true;
        }
        return false;
      });
      changed ||= attendanceChanged;
    }
    return changed;
  }

  private async generateActivationMeals(pattern: any, now = new Date()) {
    const todayKey = getDhakaDateKey(now);
    const dates = [
      parseMealDate(todayKey),
      parseMealDate(shiftDateKey(todayKey, 1)),
    ].filter((date) => {
      const start = new Date(pattern.start_date).getTime();
      const end = pattern.end_date
        ? new Date(pattern.end_date).getTime()
        : Number.POSITIVE_INFINITY;
      return date.getTime() >= start && date.getTime() <= end;
    });
    const changedDates: Date[] = [];
    for (const date of dates) {
      if (await this.generateDate(pattern, date)) changedDates.push(date);
    }
    if (changedDates.length) {
      await this.billReconciliation.reconcile(
        pattern.membership.mess_id,
        ...changedDates,
      );
    }
  }

  /** Removes only editable, future rows that were generated by this pattern. */
  private async removeFuturePatternAttendances(pattern: any, now = new Date()) {
    const firstFutureDate = parseMealDate(shiftDateKey(getDhakaDateKey(now), 1));
    const attendances = await this.prisma.mealAttendance.findMany({
      where: {
        source: MealAttendanceSource.PATTERN,
        pattern_id: pattern.id,
        member_id: pattern.membership.user_id,
        meal: {
          mess_id: pattern.membership.mess_id,
          scheduled_date: { gte: firstFutureDate },
          is_locked: false,
          status: { notIn: [MealStatus.LOCKED, MealStatus.CANCELLED] },
        },
      },
      select: { id: true, meal: { select: { scheduled_date: true } } },
    });
    if (!attendances.length) return;
    await this.prisma.mealAttendance.deleteMany({ where: { id: { in: attendances.map((attendance) => attendance.id) } } });
    await this.billReconciliation.reconcile(
      pattern.membership.mess_id,
      ...attendances.map((attendance) => attendance.meal.scheduled_date),
    );
  }

  private async getMembership(id: string) { const membership = await this.prisma.messMembership.findUnique({ where: { id }, include: { mess: true } }); if (!membership) throw new NotFoundException('Mess membership not found'); if (!membership.is_active) throw new ConflictException('Membership is not active'); return membership; }
  private async isAllowed(actorId: string, role: string, membership: any) {
    if (role === 'ADMIN' || membership.user_id === actorId || membership.mess.created_by === actorId) return true;
    const actorMembership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: membership.mess_id, user_id: actorId } },
      select: { is_active: true, role: true },
    });
    return Boolean(actorMembership?.is_active && actorMembership.role === MembershipRole.MANAGER);
  }
  private async assertAccess(actorId: string, role: string, membership: any, _manage: boolean) { if (!await this.isAllowed(actorId, role, membership)) throw new ForbiddenException('You do not have access to this meal pattern'); }
  private async ensureActiveSubscription(messId: string, role: string) {
    if (!config.features.subscriptionEnabled || role === 'ADMIN') return;
    const subscription = await this.prisma.subscription.findUnique({ where: { mess_id: messId }, select: { status: true, end_date: true } });
    const active = subscription?.status === 'ACTIVE' && (!subscription.end_date || subscription.end_date.getTime() >= Date.now());
    if (!active) throw new ForbiddenException('The mess subscription must be active to change meal patterns');
  }
}
