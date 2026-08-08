import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MealAttendanceSource, MealName, MealPatternStatus, MealPatternType, MembershipRole, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMealPatternDto, UpdateMealPatternDto } from './dto/meal-pattern.dto';
import { dateKey, normalizeSchedule, parseDate, scheduleForDate } from './meal-pattern.policy';

const WINDOW_DAYS = 14;
const patternInclude = {
  membership: { include: { user: { select: { id: true, name: true, email: true } }, mess: { select: { id: true, name: true } } } },
  creator: { select: { id: true, name: true, email: true } },
} satisfies Prisma.MealPatternInclude;

@Injectable()
export class MealPatternService {
  constructor(private readonly prisma: PrismaService) {}

  async create(actorId: string, role: string, dto: CreateMealPatternDto) {
    const membership = await this.getMembership(dto.membershipId);
    await this.assertAccess(actorId, role, membership, true);
    const start = parseDate(dto.startDate);
    const end = dto.endDate ? parseDate(dto.endDate) : null;
    if (end && end < start) throw new ConflictException('endDate must be on or after startDate');
    const schedule = normalizeSchedule(dto.patternType, dto.dailySchedule, dto.weeklySchedule);
    return this.prisma.$transaction(async (tx) => {
      const latest = await tx.mealPattern.findFirst({ where: { membership_id: membership.id }, orderBy: { version: 'desc' } });
      const active = await tx.mealPattern.findFirst({ where: { membership_id: membership.id, status: MealPatternStatus.ACTIVE } });
      const activate = dto.activate !== false;
      if (activate && active) {
        const previousEnd = new Date(start.getTime() - 86400000);
        await tx.mealPattern.update({ where: { id: active.id }, data: { end_date: previousEnd, status: MealPatternStatus.ENDED } });
      }
      return tx.mealPattern.create({
        data: { series_id: latest?.series_id ?? randomUUID(), version: (latest?.version ?? 0) + 1, membership_id: membership.id, pattern_type: dto.patternType, status: activate ? MealPatternStatus.ACTIVE : MealPatternStatus.DRAFT, start_date: start, end_date: end, daily_schedule: schedule.dailySchedule ?? Prisma.JsonNull, weekly_schedule: schedule.weeklySchedule ?? Prisma.JsonNull, created_by: actorId },
        include: patternInclude,
      });
    });
  }

  async findMine(actorId: string, role: string, membershipId?: string) {
    const memberships = await this.prisma.messMembership.findMany({ where: membershipId ? { id: membershipId } : { user_id: actorId, is_active: true }, select: { id: true, user_id: true, role: true, mess_id: true, mess: { select: { created_by: true } } } });
    const allowed = memberships.filter((m) => this.isAllowed(actorId, role, m, false));
    return this.prisma.mealPattern.findMany({ where: { membership_id: { in: allowed.map((m) => m.id) } }, include: patternInclude, orderBy: [{ membership_id: 'asc' }, { version: 'desc' }] });
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
    if (current.status === MealPatternStatus.CANCELLED || current.status === MealPatternStatus.ENDED) throw new ConflictException('Only an active, paused, or draft pattern can be changed');
    const type = dto.patternType ?? current.pattern_type;
    const schedule = normalizeSchedule(type, dto.dailySchedule ?? current.daily_schedule, dto.weeklySchedule ?? current.weekly_schedule);
    const start = dto.startDate ? parseDate(dto.startDate) : current.start_date;
    const end = dto.endDate === undefined ? current.end_date : dto.endDate ? parseDate(dto.endDate) : null;
    if (end && end < start) throw new ConflictException('endDate must be on or after startDate');
    return this.prisma.$transaction(async (tx) => {
      await tx.mealPattern.update({ where: { id }, data: { status: MealPatternStatus.ENDED, end_date: new Date(start.getTime() - 86400000) } });
      return tx.mealPattern.create({ data: { series_id: current.series_id, version: current.version + 1, membership_id: current.membership_id, pattern_type: type, status: current.status, start_date: start, end_date: end, daily_schedule: schedule.dailySchedule ?? Prisma.JsonNull, weekly_schedule: schedule.weeklySchedule ?? Prisma.JsonNull, created_by: actorId }, include: patternInclude });
    });
  }

  async changeStatus(id: string, actorId: string, role: string, status: MealPatternStatus) {
    const pattern = await this.prisma.mealPattern.findUnique({ where: { id }, include: { membership: { include: { mess: true } } } });
    if (!pattern) throw new NotFoundException('Meal pattern not found');
    await this.assertAccess(actorId, role, pattern.membership, true);
    if (status === MealPatternStatus.ACTIVE) {
      await this.prisma.$transaction(async (tx) => {
        await tx.mealPattern.updateMany({ where: { membership_id: pattern.membership_id, status: MealPatternStatus.ACTIVE, id: { not: id } }, data: { status: MealPatternStatus.ENDED, end_date: new Date(pattern.start_date.getTime() - 86400000) } });
        await tx.mealPattern.update({ where: { id }, data: { status } });
      });
    } else await this.prisma.mealPattern.update({ where: { id }, data: { status } });
    return this.findOne(id, actorId, role);
  }

  @Cron('*/10 * * * *')
  async generateUpcomingMeals() {
    const today = new Date(`${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date())}T00:00:00.000Z`);
    const horizon = new Date(today.getTime() + WINDOW_DAYS * 86400000);
    const patterns = await this.prisma.mealPattern.findMany({ where: { status: MealPatternStatus.ACTIVE, start_date: { lte: horizon }, OR: [{ end_date: null }, { end_date: { gte: today } }] }, include: { membership: true } });
    for (const pattern of patterns) {
      const from = pattern.start_date > today ? pattern.start_date : today;
      const to = pattern.end_date && pattern.end_date < horizon ? pattern.end_date : horizon;
      for (let cursor = new Date(from); cursor <= to; cursor = new Date(cursor.getTime() + 86400000)) await this.generateDate(pattern, cursor);
    }
  }

  private async generateDate(pattern: any, scheduledDate: Date) {
    const schedule = scheduleForDate(pattern, scheduledDate);
    for (const mealName of Object.keys(schedule) as MealName[]) {
      if (!schedule[mealName]) continue;
      await this.prisma.$transaction(async (tx) => {
        const meal = await tx.meal.upsert({ where: { mess_id_name_scheduled_date: { mess_id: pattern.membership.mess_id, name: mealName, scheduled_date: scheduledDate } }, update: {}, create: { mess_id: pattern.membership.mess_id, name: mealName, scheduled_date: scheduledDate, created_by: pattern.created_by, status: 'CONFIRMED' } });
        if (meal.is_locked || meal.status === 'LOCKED' || meal.status === 'CANCELLED') return;
        await tx.mealAttendance.createMany({ data: [{ meal_id: meal.id, member_id: pattern.membership.user_id, status: 'ON', source: MealAttendanceSource.PATTERN, pattern_id: pattern.id }], skipDuplicates: true });
      });
    }
  }

  private async getMembership(id: string) { const membership = await this.prisma.messMembership.findUnique({ where: { id }, include: { mess: true } }); if (!membership) throw new NotFoundException('Mess membership not found'); if (!membership.is_active) throw new ConflictException('Membership is not active'); return membership; }
  private isAllowed(actorId: string, role: string, membership: any, manage: boolean) { if (role === 'ADMIN' || membership.user_id === actorId) return true; if (!manage) return membership.role === MembershipRole.MANAGER || membership.mess.created_by === actorId || role === 'MANAGER'; return membership.role === MembershipRole.MANAGER || membership.mess.created_by === actorId || role === 'MANAGER'; }
  private async assertAccess(actorId: string, role: string, membership: any, manage: boolean) { if (!this.isAllowed(actorId, role, membership, manage)) throw new ForbiddenException('You do not have access to this meal pattern'); }
}
