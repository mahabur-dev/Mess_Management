import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  SetMealDeadlineDto,
  CreateMealDto,
  MealFilterDto,
  UpdateMealDto,
} from './dto/meal.dto';
import { AttendanceStatus, MealName, MembershipRole, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonthlyBillService } from '../monthly-bill/monthly-bill.service';
import { NotificationService } from '../notification/notification.service';

// ─── Constants ──────────────────────────────────────────────
const DEFAULT_DEADLINE_START = '22:00'; // 10 PM - meal window opens
const DEFAULT_DEADLINE_END = '11:00';   // 11 AM next day - meal window closes

/**
 * Base meal value per meal type when attendance is ON.
 * BREAKFAST = 0.5 meal, LUNCH = 1 meal, DINNER = 1 meal.
 */
const MEAL_BASE_VALUE: Record<MealName, number> = {
  [MealName.BREAKFAST]: 0.5,
  [MealName.LUNCH]: 1,
  [MealName.DINNER]: 1,
};

/**
 * Get the base meal value for a given meal name.
 * A meal that is ON contributes this base value *before* any guest additions.
 */
function getMealBaseValue(mealName: MealName): number {
  return MEAL_BASE_VALUE[mealName] ?? 1;
}

/**
 * Parse "HH:mm" string into total minutes since midnight.
 */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) throw new Error(`Invalid time format: ${time}`);
  return h * 60 + m;
}

function formatLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

function isSameOrAfterToday(targetDate: Date, now: Date = new Date()): boolean {
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  return target.getTime() >= current.getTime();
}

function isSameDay(targetDate: Date, now: Date = new Date()): boolean {
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  return target.getTime() === current.getTime();
}

function isWithinMealWindow(
  targetDate: Date,
  startTime: string,
  endTime: string,
  now: Date = new Date(),
): boolean {
  if (!isSameOrAfterToday(targetDate, now)) return false;
  if (!isSameDay(targetDate, now)) return true;

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  const windowStart = new Date(now);
  windowStart.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

  const windowEnd = new Date(now);
  windowEnd.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);

  if (endMinutes <= startMinutes) {
    windowEnd.setDate(windowEnd.getDate() + 1);
  }

  return now >= windowStart && now <= windowEnd;
}

@Injectable()
export class MealService {
  private readonly logger = new Logger(MealService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlyBillService: MonthlyBillService,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Cron / Scheduled Tasks ────────────────────────────────

  /**
   * Every minute check if any deadline window is about to close in 15 minutes,
   * and send push notifications.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async checkUpcomingDeadlines() {
    const now = new Date();

    // Find all active messes with their deadline config
    const messes = await this.prisma.mess.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        meal_deadline_start: true,
        meal_deadline_end: true,
      },
    });

    for (const mess of messes) {
      const startTime = mess.meal_deadline_start ?? DEFAULT_DEADLINE_START;
      const endTime = mess.meal_deadline_end ?? DEFAULT_DEADLINE_END;

      // Get today and tomorrow dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check if the deadline is ending soon for today (if endTime applies to today)
      // or for tomorrow (if endTime applies to tomorrow)
      const todayEnd = new Date(today);
      todayEnd.setHours(
        Math.floor(parseTimeToMinutes(endTime) / 60),
        parseTimeToMinutes(endTime) % 60,
        0, 0,
      );

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(
        Math.floor(parseTimeToMinutes(endTime) / 60),
        parseTimeToMinutes(endTime) % 60,
        0, 0,
      );

      // Check 15 min warning for today's deadline
      if (Math.abs(now.getTime() - todayEnd.getTime() - 15 * 60 * 1000) < 60000) {
        await this.sendDeadlineWarningNotification(mess.id, mess.name, today, endTime);
      }

      // Check 15 min warning for tomorrow's deadline (if end is in morning)
      if (Math.abs(now.getTime() - tomorrowEnd.getTime() - 15 * 60 * 1000) < 60000) {
        await this.sendDeadlineWarningNotification(mess.id, mess.name, tomorrow, endTime);
      }

      // Check if the meal window just opened (now is within 1 minute of window start)
      const windowStartToday = new Date(today);
      windowStartToday.setDate(windowStartToday.getDate() - 1);
      windowStartToday.setHours(
        Math.floor(parseTimeToMinutes(startTime) / 60),
        parseTimeToMinutes(startTime) % 60,
        0, 0,
      );

      if (Math.abs(now.getTime() - windowStartToday.getTime()) < 60000) {
        await this.sendMealWindowOpenedNotification(mess.id, mess.name, today, startTime, endTime);
      }
    }
  }

  private async sendDeadlineWarningNotification(
    messId: string,
    messName: string,
    date: Date,
    endTime: string,
  ) {
    try {
      const dateStr = date.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
      const targetUserIds = await this.resolveMealNotificationUserIds(messId);
      const dedupeKey = `meal:deadline-warning:${messId}:${formatLocalDateKey(date)}:${endTime}`;

      await this.notificationService.createForMess(
        null,
        messId,
        'MEAL_UPDATE',
        `⏰ Meal deadline closing soon - ${messName}`,
        `Meal time will close at ${endTime} for ${dateStr}. Please add/update your meals now!`,
        { type: 'MEAL_DEADLINE_WARNING', date: date.toISOString(), endTime },
        targetUserIds,
        '/dashboard/meals',
        dedupeKey,
      );
    } catch (error) {
      this.logger.error(`Failed to send deadline warning for mess ${messId}:`, error);
    }
  }

  private async sendMealWindowOpenedNotification(
    messId: string,
    messName: string,
    date: Date,
    startTime: string,
    endTime: string,
  ) {
    try {
      const dateStr = date.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
      const targetUserIds = await this.resolveMealNotificationUserIds(messId);
      const dedupeKey = `meal:window-opened:${messId}:${formatLocalDateKey(date)}:${startTime}:${endTime}`;

      await this.notificationService.createForMess(
        null,
        messId,
        'MEAL_UPDATE',
        `🍽️ Meal time is now open - ${messName}`,
        `You can now add your meals for ${dateStr}. Deadline: ${endTime}.`,
        {
          type: 'MEAL_WINDOW_OPENED',
          date: date.toISOString(),
          startTime,
          endTime,
        },
        targetUserIds,
        '/dashboard/meals',
        dedupeKey,
      );
    } catch (error) {
      this.logger.error(`Failed to send meal window notification for mess ${messId}:`, error);
    }
  }

  private async resolveMealNotificationUserIds(messId: string) {
    const memberships = await this.prisma.messMembership.findMany({
      where: {
        mess_id: messId,
        is_active: true,
        role: { in: [MembershipRole.MANAGER, MembershipRole.MEMBER] },
      },
      select: {
        user_id: true,
        user: {
          select: {
            id: true,
            role: true,
            is_active: true,
          },
        },
      },
    });

    return [...new Set(
      memberships
        .filter((membership) => membership.user.is_active && membership.user.role !== 'ADMIN')
        .map((membership) => membership.user_id),
    )];
  }

  // ─── Private Helpers ───────────────────────────────────────

  private async recalculateMealMonthBill(messId: string, date: Date) {
    await this.monthlyBillService.recalculateMonthlyBills(messId, date);
  }

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

  private async ensureActiveSubscription(messId: string, role: string): Promise<void> {
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
        'Your subscription has expired. Please renew it to continue using meal features.',
        403,
      );
    }
  }

  private async canManageMeal(
    messId: string,
    userId: string,
    role: string,
  ): Promise<boolean> {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (role === 'MANAGER' && mess.created_by === userId) return true;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });

    return Boolean(membership?.is_active && membership.role === MembershipRole.MANAGER);
  }

  /**
   * Check if the current time is within the meal deadline window for the given date.
   * Managers bypass this check; members must stay inside the configured window.
   */
  private async checkMealDeadline(
    messId: string,
    date: Date,
    userId: string,
    role: string,
  ): Promise<void> {
    const isManager = await this.canManageMeal(messId, userId, role);
    if (isManager) return;

    if (role === 'ADMIN') {
      throw new HttpException('Forbidden: Admin cannot modify meal entries', 403);
    }

    if (!isSameOrAfterToday(date)) {
      throw new HttpException(
        'Forbidden: You can only add or update meals for today or future dates',
        400,
      );
    }

    if (isSameDay(date)) {
      const mess = await this.prisma.mess.findUnique({
        where: { id: messId },
        select: { meal_deadline_start: true, meal_deadline_end: true },
      });
      if (!mess) throw new HttpException('Mess not found', 404);

      const startTime = mess.meal_deadline_start ?? DEFAULT_DEADLINE_START;
      const endTime = mess.meal_deadline_end ?? DEFAULT_DEADLINE_END;

      if (!isWithinMealWindow(date, startTime, endTime)) {
        throw new HttpException(
          `Meal deadline has passed. Meal window is ${startTime} - ${endTime} (next day). Only managers can modify meals now.`,
          400,
        );
      }
    }
  }

  /**
   * Get the effective deadline times for a mess.
   */
  async getMessDeadlineConfig(messId: string) {
    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: {
        meal_deadline_start: true,
        meal_deadline_end: true,
      },
    });
    if (!mess) throw new HttpException('Mess not found', 404);

    return {
      startTime: mess.meal_deadline_start ?? DEFAULT_DEADLINE_START,
      endTime: mess.meal_deadline_end ?? DEFAULT_DEADLINE_END,
    };
  }

  /**
   * Check if a specific meal date/time is still within the window for members.
   */
  async isMealWindowOpen(messId: string, date: string): Promise<boolean> {
    const targetDate = new Date(date);
    const deadlineConfig = await this.getMessDeadlineConfig(messId);

    return isWithinMealWindow(
      targetDate,
      deadlineConfig.startTime,
      deadlineConfig.endTime,
    );
  }

  // ─── CRUD Operations ──────────────────────────────────────

  async create(userId: string, role: string, dto: CreateMealDto) {
    await this.verifyMessAccess(dto.messId, userId, role);
    await this.ensureActiveSubscription(dto.messId, role);

    const date = dto.date ? new Date(dto.date) : new Date();
    const mealName = dto.mealName ?? MealName.LUNCH;

    // Check meal deadline (bypasses for managers/admin)
    await this.checkMealDeadline(dto.messId, date, userId, role);

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

    const targetMemberId = role === 'MEMBER' ? userId : (dto.memberId ?? userId);

    // Determine status: if mealCount === 0 → OFF; if mealCount > 0 → ON
    // mealCount is the total meal count desired by the user.
    // For fractional support, mealCount = 0 means OFF, > 0 means ON.
    const status: AttendanceStatus =
      dto.status ?? (dto.mealCount === 0 ? AttendanceStatus.OFF : AttendanceStatus.ON);

    // Guests field stores the *additional* fractional meals beyond the base value.
    // If the user explicitly provides guests, use it.
    // Otherwise, if mealCount is provided, derive guests = mealCount - baseValue (when status is ON).
    let guestsDecimal: number;
    if (dto.guests !== undefined) {
      guestsDecimal = dto.guests;
    } else if (status === AttendanceStatus.ON) {
      // mealCount is the total desired meal count, so guests = total - baseValue
      const base = getMealBaseValue(mealName);
      guestsDecimal = Math.max(0, +(dto.mealCount - base).toFixed(2));
    } else {
      guestsDecimal = 0;
    }

    const attendance = await this.prisma.mealAttendance.upsert({
      where: {
        meal_id_member_id: {
          meal_id: savedMeal.id,
          member_id: targetMemberId,
        },
      },
      update: {
        status,
        guests: guestsDecimal,
      },
      create: {
        meal_id: savedMeal.id,
        member_id: targetMemberId,
        status,
        guests: guestsDecimal,
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

    // await this.recalculateMealMonthBill(dto.messId, savedMeal.scheduled_date);

    return attendance;
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

    // Check meal deadline (bypasses for managers/admin)
    const date = dto.date ? new Date(dto.date) : meal.scheduled_date;
    await this.checkMealDeadline(meal.mess_id, date, userId, role);

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

    await this.ensureActiveSubscription(meal.mess_id, role);

    const oldMessId = meal.mess_id;
    const oldDate = meal.scheduled_date;

    const updatedMeal = await this.prisma.meal.update({
      where: { id },
      data: {
        scheduled_date: dto.date ? new Date(dto.date) : undefined,
        status: dto.mealStatus,
        is_locked: dto.mealStatus === 'LOCKED' ? true : undefined,
      },
      include: { creator: { select: { id: true, name: true } } },
    });

    // Update attendance if status, guests, or mealCount is provided
    if (dto.status !== undefined || dto.guests !== undefined || dto.mealCount !== undefined) {
      // Fetch existing attendance for fallback logic
      const existingAttendance = await this.prisma.mealAttendance.findUnique({
        where: {
          meal_id_member_id: {
            meal_id: id,
            member_id: userId,
          },
        },
      });

      // Determine new status
      // Priority: dto.status > derived from mealCount > existing status > ON
      let newStatus: AttendanceStatus;
      if (dto.status !== undefined) {
        newStatus = dto.status;
      } else if (dto.mealCount !== undefined) {
        newStatus = dto.mealCount === 0 ? AttendanceStatus.OFF : AttendanceStatus.ON;
      } else {
        newStatus = existingAttendance?.status ?? AttendanceStatus.ON;
      }

      // Determine new guests value stored in DB
      // Priority: dto.guests > derived from mealCount > existing guests
      let newGuests: number;
      if (dto.guests !== undefined) {
        // If guests is explicitly provided, use it directly (it represents additional meals beyond base)
        newGuests = dto.guests;
      } else if (dto.mealCount !== undefined) {
        if (newStatus === AttendanceStatus.ON) {
          // mealCount = baseValue + guests, so guests = mealCount - baseValue
          const base = getMealBaseValue(meal.name);
          newGuests = Math.max(0, +(dto.mealCount - base).toFixed(2));
        } else {
          // Status is OFF, so guests = 0
          newGuests = 0;
        }
      } else {
        // No changes to guests or mealCount — keep existing
        newGuests = Number(existingAttendance?.guests ?? 0);
      }

      await this.prisma.mealAttendance.upsert({
        where: {
          meal_id_member_id: {
            meal_id: id,
            member_id: userId,
          },
        },
        update: {
          status: newStatus,
          guests: newGuests,
        },
        create: {
          meal_id: id,
          member_id: userId,
          status: newStatus,
          guests: newGuests,
        },
      });
    }

    // await this.recalculateMealMonthBill(oldMessId, oldDate);

    // if (dto.date) {
    //   await this.recalculateMealMonthBill(updatedMeal.mess_id, updatedMeal.scheduled_date);
    // }

    return updatedMeal;
  }

  /**
   * Set the meal deadline window for a mess.
   * This replaces the old "close meal time" functionality.
   * The deadline is a time window (e.g. 22:00 -> 11:00) during which
   * members can add/update meals. After the window closes, only managers can modify.
   */
  async setMealDeadline(
    messId: string,
    userId: string,
    role: string,
    dto: SetMealDeadlineDto,
  ) {
    // Only managers can set meal deadlines
    const canManage = await this.canManageMeal(messId, userId, role);
    if (!canManage) {
      throw new HttpException(
        'Forbidden: Only managers can set meal deadlines',
        403,
      );
    }
    await this.ensureActiveSubscription(messId, role);

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(dto.startTime)) {
      throw new HttpException('startTime must be in HH:mm format (e.g. 22:00)', 400);
    }
    if (!timeRegex.test(dto.endTime)) {
      throw new HttpException('endTime must be in HH:mm format (e.g. 11:00)', 400);
    }

    const updatedMess = await this.prisma.mess.update({
      where: { id: messId },
      data: {
        meal_deadline_start: dto.startTime,
        meal_deadline_end: dto.endTime,
      },
      select: {
        id: true,
        name: true,
        meal_deadline_start: true,
        meal_deadline_end: true,
      },
    });

    return {
      message: 'Meal deadline updated successfully',
      data: {
        messId: updatedMess.id,
        messName: updatedMess.name,
        startTime: updatedMess.meal_deadline_start,
        endTime: updatedMess.meal_deadline_end,
      },
    };
  }

  /**
   * Get the current meal deadline configuration for a mess.
   */
  async getMealDeadlineInfo(messId: string, date?: string) {
    const deadlineConfig = await this.getMessDeadlineConfig(messId);
    const targetDate = date ? new Date(date) : new Date();

    return {
      startTime: deadlineConfig.startTime,
      endTime: deadlineConfig.endTime,
      isWindowOpen: isWithinMealWindow(
        targetDate,
        deadlineConfig.startTime,
        deadlineConfig.endTime,
      ),
      windowStartTime: deadlineConfig.startTime,
      windowEndTime: deadlineConfig.endTime,
    };
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

    await this.ensureActiveSubscription(meal.mess_id, role);

    await this.prisma.meal.delete({ where: { id } });

    // await this.recalculateMealMonthBill(meal.mess_id, meal.scheduled_date);

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
        const [attendances, depositTotal] = await Promise.all([
          this.prisma.mealAttendance.findMany({
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
            include: {
              meal: { select: { name: true } },
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

        // Calculate total meals using base meal value + guests
        const totalMeals = attendances.reduce((sum, att) => {
          return sum + calculateTotalMeals(
            AttendanceStatus.ON,
            att.meal.name as MealName,
            att.guests,
          );
        }, 0);

        return {
          user: member.user,
          totalMeals: +totalMeals.toFixed(2),
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
      totalMeals: +totalMeals.toFixed(2),
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
