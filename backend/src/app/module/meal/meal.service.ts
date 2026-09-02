import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  AttendanceStatus,
  MealAttendanceSource,
  MealName,
  MealStatus,
  MembershipRole,
  Prisma,
} from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import config from 'src/app/config';
import { apiMessage } from 'src/app/contracts/api-message.contract';
import { MonthlyBillReconciliationService } from '../monthly-bill/monthly-bill-reconciliation.service';
import { NotificationService } from '../notification/notification.service';
import {
  BulkUpdateMealsDto,
  CreateMealDto,
  MealFilterDto,
  SetMealDeadlineDto,
  UpdateMealDto,
  UpdateMealSettingsDto,
} from './dto/meal.dto';
import {
  bulkMealUpdateKey,
  mealCountFromAttendance,
  normalizeBulkMealUpdates,
  type NormalizedBulkMealUpdate,
} from './meal-bulk.policy';
import {
  assertValidMealWindow,
  DEFAULT_MEAL_WINDOW_END,
  DEFAULT_MEAL_WINDOW_START,
  getDhakaDateKey,
  getMealBaseValue,
  getMealDecisionWindow,
  MEAL_TIME_ZONE,
  normalizeMealAttendance,
  parseMealDate,
  shiftDateKey,
} from './meal-policy';

const REMINDER_POLL_MINUTES = 5;
const REMINDER_POLL_MS = REMINDER_POLL_MINUTES * 60 * 1000;
const MEAL_LIST_SORT_FIELDS = new Set([
  'created_at',
  'updated_at',
  'scheduled_date',
  'name',
  'status',
]);

const mealInclude = Prisma.validator<Prisma.MealInclude>()({
  creator: { select: { id: true, name: true } },
  mess: { select: { id: true, name: true } },
  attendances: {
    include: {
      member: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar_url: true,
        },
      },
    },
    orderBy: { member: { name: 'asc' } },
  },
});

interface MessAccessContext {
  mess: {
    id: string;
    name: string;
    created_by: string;
    meal_deadline_start: string;
    meal_deadline_end: string;
    meal_default_status: AttendanceStatus;
    meal_allow_no_meal: boolean;
    meal_window_notification_enabled: boolean;
    meal_deadline_notification_enabled: boolean;
    meal_deadline_reminder_minutes: number;
  };
  canManage: boolean;
}

export interface PreparedMeal {
  context: MessAccessContext;
  targetMemberId: string;
  scheduledDate: Date;
  dateKey: string;
  normalized: {
    status: AttendanceStatus;
    guests: number;
    mealCount: number;
  };
}

@Injectable()
export class MealService {
  private readonly logger = new Logger(MealService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billReconciliation: MonthlyBillReconciliationService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(`*/${REMINDER_POLL_MINUTES} * * * *`, {
    timeZone: MEAL_TIME_ZONE,
  })
  async sendMealDecisionReminders(): Promise<void> {
    let now: Date;
    let targetDate: string;
    let messes: Array<{
      id: string;
      name: string;
      created_by: string;
      meal_deadline_start: string | null;
      meal_deadline_end: string | null;
      meal_window_notification_enabled: boolean;
      meal_deadline_notification_enabled: boolean;
      meal_deadline_reminder_minutes: number;
    }>;

    try {
      now = new Date();
      targetDate = shiftDateKey(getDhakaDateKey(now), 1);
      messes = await this.prisma.mess.findMany({
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          created_by: true,
          meal_deadline_start: true,
          meal_deadline_end: true,
          meal_window_notification_enabled: true,
          meal_deadline_notification_enabled: true,
          meal_deadline_reminder_minutes: true,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Meal reminder job skipped: ${this.schedulerErrorMessage(error)}`,
      );
      return;
    }

    for (const mess of messes) {
      try {
        const window = getMealDecisionWindow(
          targetDate,
          mess.meal_deadline_start ?? DEFAULT_MEAL_WINDOW_START,
          mess.meal_deadline_end ?? DEFAULT_MEAL_WINDOW_END,
          now,
        );

        if (
          mess.meal_window_notification_enabled &&
          this.isWithinPollInterval(now, window.windowStart)
        ) {
          await this.sendWindowOpenedNotification(
            mess.id,
            mess.name,
            mess.created_by,
            window.targetDate,
            window.startTime,
            window.endTime,
          );
        }

        const warningAt = new Date(
          window.windowEnd.getTime() -
            mess.meal_deadline_reminder_minutes * 60 * 1000,
        );
        if (
          mess.meal_deadline_notification_enabled &&
          this.isWithinPollInterval(now, warningAt)
        ) {
          await this.sendDeadlineWarningNotification(
            mess.id,
            mess.name,
            mess.created_by,
            window.targetDate,
            window.endTime,
            mess.meal_deadline_reminder_minutes,
          );
        }
      } catch (error) {
        this.logger.error(
          `Meal reminder processing failed for mess ${mess.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
  private async runTransactionWithRetry<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options: {
      isolationLevel?: Prisma.TransactionIsolationLevel;
      maxWait?: number;
      timeout?: number;
    } = {},
    retries = 3,
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.prisma.$transaction(fn, options);
      } catch (error) {
        const isRetriable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2034' || // write conflict / deadlock
            error.message?.includes('write conflict or a deadlock'));

        if (isRetriable && attempt < retries) {
          await new Promise((r) => setTimeout(r, 30 * attempt)); // small backoff
          continue;
        }
        throw error;
      }
    }
    throw new Error('Transaction retry limit exceeded');
  }
  /** Shared validation boundary used by manual and AI workflows. */
  async prepareCreate(
    userId: string,
    role: string,
    dto: CreateMealDto,
  ): Promise<PreparedMeal> {
    const context = await this.getMessAccessContext(dto.messId, userId, role);
    await this.ensureActiveSubscription(dto.messId, role);

    const targetMemberId = dto.memberId ?? userId;
    if (targetMemberId !== userId && !context.canManage) {
      throw new ForbiddenException(
        'Members can only add or edit their own meal attendance',
      );
    }
    await this.assertActiveMealMember(dto.messId, targetMemberId, context);

    const scheduledDate = this.parseDate(dto.date);
    const dateKey = scheduledDate.toISOString().slice(0, 10);
    if (!context.canManage) {
      this.assertMemberWindow(context, dateKey);
    }

    const normalized = this.normalizeAttendance(dto, context);
    if (
      !context.canManage &&
      !context.mess.meal_allow_no_meal &&
      normalized.status === AttendanceStatus.OFF
    ) {
      throw new ForbiddenException(
        'No-meal selection is disabled by the mess manager',
      );
    }

    return {
      context,
      targetMemberId,
      scheduledDate,
      dateKey,
      normalized,
    };
  }

  /** Shared write boundary. The caller owns the transaction. */
  async persistCreate(
    tx: Prisma.TransactionClient,
    userId: string,
    dto: CreateMealDto,
    prepared: PreparedMeal,
  ) {
    const { context, targetMemberId, scheduledDate, dateKey, normalized } =
      prepared;
    const uniqueMeal = {
      mess_id_name_scheduled_date: {
        mess_id: dto.messId,
        name: dto.mealName,
        scheduled_date: scheduledDate,
      },
    };
    const existingMeal = await tx.meal.findUnique({ where: uniqueMeal });

    if (
      !context.canManage &&
      (existingMeal?.is_locked || existingMeal?.status === MealStatus.LOCKED)
    ) {
      throw new ForbiddenException(
        'This meal is locked and can only be changed by a manager',
      );
    }
    if (!context.canManage && existingMeal?.status === MealStatus.CANCELLED) {
      throw new ForbiddenException(
        'This meal is cancelled and can only be restored by a manager',
      );
    }

    const meal = await tx.meal.upsert({
      where: uniqueMeal,
      update: {
        status: existingMeal?.is_locked
          ? MealStatus.LOCKED
          : MealStatus.CONFIRMED,
      },
      create: {
        mess_id: dto.messId,
        created_by: userId,
        name: dto.mealName,
        scheduled_date: scheduledDate,
        status: MealStatus.CONFIRMED,
      },
    });

    const previousAttendance = await tx.mealAttendance.findUnique({
      where: {
        meal_id_member_id: {
          meal_id: meal.id,
          member_id: targetMemberId,
        },
      },
      select: { id: true, status: true, guests: true },
    });
    const savedAttendance = await tx.mealAttendance.upsert({
      where: {
        meal_id_member_id: {
          meal_id: meal.id,
          member_id: targetMemberId,
        },
      },
      update: {
        status: normalized.status,
        guests: normalized.guests,
        source: MealAttendanceSource.MANUAL,
        pattern_id: null,
      },
      create: {
        meal_id: meal.id,
        member_id: targetMemberId,
        status: normalized.status,
        guests: normalized.guests,
        source: MealAttendanceSource.MANUAL,
      },
      include: {
        meal: {
          include: {
            creator: { select: { id: true, name: true } },
            mess: { select: { id: true, name: true } },
          },
        },
        member: {
          select: { id: true, name: true, email: true, avatar_url: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        mess_id: dto.messId,
        actor_id: userId,
        action: previousAttendance
          ? 'MEAL_ATTENDANCE_UPDATED'
          : 'MEAL_ATTENDANCE_CREATED',
        entity_type: 'MealAttendance',
        entity_id: savedAttendance.id,
        diff: {
          targetMemberId,
          mealId: meal.id,
          date: dateKey,
          mealName: dto.mealName,
          before: previousAttendance
            ? {
                status: previousAttendance.status,
                guests: Number(previousAttendance.guests),
              }
            : null,
          after: {
            status: normalized.status,
            guests: normalized.guests,
            mealCount: normalized.mealCount,
          },
        },
      },
    });

    return savedAttendance;
  }

  /** Post-commit effects shared by manual and AI creation. */
  async completeCreate(prepared: PreparedMeal, attendance: any) {
    const billingSync = await this.billReconciliation.reconcile(
      prepared.context.mess.id,
      prepared.scheduledDate,
    );
    return { ...attendance, billingSync };
  }

  async create(userId: string, role: string, dto: CreateMealDto) {
    const prepared = await this.prepareCreate(userId, role, dto);

    const attendance = await this.runTransactionWithRetry(
      (tx) => this.persistCreate(tx, userId, dto, prepared),
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );

    return this.completeCreate(prepared, attendance);
  }

  async bulkUpdateAttendances(
    messId: string,
    userId: string,
    role: string,
    dto: BulkUpdateMealsDto,
  ) {
    const context = await this.getMessAccessContext(messId, userId, role);
    this.assertManager(context);
    await this.ensureActiveSubscription(messId, role);

    const scheduledDate = this.parseDate(dto.date);
    const dateKey = scheduledDate.toISOString().slice(0, 10);
    let updates: NormalizedBulkMealUpdate[];
    try {
      updates = normalizeBulkMealUpdates(
        dto.updates,
        context.mess.meal_default_status,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid bulk meal update',
      );
    }

    const activeMembers = await this.loadActiveMealMembers(
      messId,
      context.mess.created_by,
    );
    const activeMemberIds = new Set(
      activeMembers.map((member) => member.user_id),
    );
    const inactiveMemberIds = [
      ...new Set(
        updates
          .map((update) => update.memberId)
          .filter((memberId) => !activeMemberIds.has(memberId)),
      ),
    ];
    if (inactiveMemberIds.length) {
      throw new BadRequestException({
        code: 'INACTIVE_MEAL_MEMBERS',
        message: 'Every bulk update must target an active member of this mess',
        memberIds: inactiveMemberIds,
      });
    }

    const committed = await this.runTransactionWithRetry(
      async (tx) => {
        const requestedMealNames = [
          ...new Set(updates.map((update) => update.mealName)),
        ];
        const existingMeals = await tx.meal.findMany({
          where: {
            mess_id: messId,
            scheduled_date: scheduledDate,
            name: { in: requestedMealNames },
          },
          select: {
            id: true,
            name: true,
            status: true,
            is_locked: true,
          },
        });
        const existingMealIds = existingMeals.map((meal) => meal.id);
        const existingAttendances: Array<{
          id: string;
          member_id: string;
          status: AttendanceStatus;
          guests: Prisma.Decimal;
          source: MealAttendanceSource;
          pattern_id: string | null;
          meal: { name: MealName };
        }> = existingMealIds.length
          ? await tx.mealAttendance.findMany({
              where: {
                meal_id: { in: existingMealIds },
                member_id: {
                  in: [...new Set(updates.map((update) => update.memberId))],
                },
              },
              select: {
                id: true,
                member_id: true,
                status: true,
                guests: true,
                source: true,
                pattern_id: true,
                meal: { select: { name: true } },
              },
            })
          : [];
        const attendanceByKey = new Map(
          existingAttendances.map((attendance) => [
            bulkMealUpdateKey(attendance.member_id, attendance.meal.name),
            attendance,
          ]),
        );

        const conflicts = updates.flatMap((update) => {
          if (update.expectedMealCount === undefined) return [];
          const attendance = attendanceByKey.get(update.key);
          const currentMealCount = mealCountFromAttendance(
            update.mealName,
            attendance,
          );
          return Math.abs(currentMealCount - update.expectedMealCount) > 0.001
            ? [
                {
                  memberId: update.memberId,
                  mealName: update.mealName,
                  expectedMealCount: update.expectedMealCount,
                  currentMealCount,
                },
              ]
            : [];
        });
        if (conflicts.length) {
          throw new ConflictException({
            code: 'MEAL_SHEET_CONFLICT',
            message:
              'The meal sheet changed after it was loaded. Refresh it before saving again.',
            conflicts,
          });
        }

        const changedUpdates = updates.filter((update) => {
          const attendance = attendanceByKey.get(update.key);
          if (!attendance) return true;
          return !(
            attendance.status === update.normalized.status &&
            Math.abs(Number(attendance.guests) - update.normalized.guests) <=
              0.001 &&
            attendance.source === MealAttendanceSource.MANUAL &&
            attendance.pattern_id === null
          );
        });
        if (!changedUpdates.length) {
          return { saved: [], updatedCount: 0 };
        }

        const changedMealNames = [
          ...new Set(changedUpdates.map((update) => update.mealName)),
        ];
        const changedMealNameSet = new Set(changedMealNames);
        const existingChangedMeals = existingMeals.filter((meal) =>
          changedMealNameSet.has(meal.name),
        );
        const existingChangedMealNames = new Set(
          existingChangedMeals.map((meal) => meal.name),
        );
        const missingMealNames = changedMealNames.filter(
          (mealName) => !existingChangedMealNames.has(mealName),
        );

        if (missingMealNames.length) {
          await tx.meal.createMany({
            data: missingMealNames.map((mealName) => ({
              mess_id: messId,
              created_by: userId,
              name: mealName,
              scheduled_date: scheduledDate,
              status: MealStatus.CONFIRMED,
            })),
            skipDuplicates: true,
          });
        }

        const lockedMealIds = existingChangedMeals
          .filter((meal) => meal.is_locked)
          .map((meal) => meal.id);
        const unlockedMealIds = existingChangedMeals
          .filter((meal) => !meal.is_locked)
          .map((meal) => meal.id);
        if (lockedMealIds.length) {
          await tx.meal.updateMany({
            where: { id: { in: lockedMealIds } },
            data: { status: MealStatus.LOCKED },
          });
        }
        if (unlockedMealIds.length) {
          await tx.meal.updateMany({
            where: { id: { in: unlockedMealIds } },
            data: { status: MealStatus.CONFIRMED },
          });
        }

        const persistedMeals = await tx.meal.findMany({
          where: {
            mess_id: messId,
            scheduled_date: scheduledDate,
            name: { in: changedMealNames },
          },
          select: { id: true, name: true },
        });
        const mealIdByName = new Map(
          persistedMeals.map((meal) => [meal.name, meal.id]),
        );

        const saved: Array<{
          id: string;
          memberId: string;
          mealName: MealName;
          status: AttendanceStatus;
          mealCount: number;
          updatedAt: Date;
        }> = [];
        const auditRows: Prisma.AuditLogCreateManyInput[] = [];
        for (const update of changedUpdates) {
          const mealId = mealIdByName.get(update.mealName);
          if (!mealId) {
            throw new ConflictException(
              `Could not prepare ${update.mealName} for ${dateKey}`,
            );
          }
          const before = attendanceByKey.get(update.key);
          const attendance = await tx.mealAttendance.upsert({
            where: {
              meal_id_member_id: {
                meal_id: mealId,
                member_id: update.memberId,
              },
            },
            update: {
              status: update.normalized.status,
              guests: update.normalized.guests,
              source: MealAttendanceSource.MANUAL,
              pattern_id: null,
            },
            create: {
              meal_id: mealId,
              member_id: update.memberId,
              status: update.normalized.status,
              guests: update.normalized.guests,
              source: MealAttendanceSource.MANUAL,
            },
            select: {
              id: true,
              member_id: true,
              status: true,
              guests: true,
              updated_at: true,
            },
          });
          saved.push({
            id: attendance.id,
            memberId: attendance.member_id,
            mealName: update.mealName,
            status: attendance.status,
            mealCount: update.normalized.mealCount,
            updatedAt: attendance.updated_at,
          });
          auditRows.push({
            mess_id: messId,
            actor_id: userId,
            action: before
              ? 'MEAL_ATTENDANCE_UPDATED'
              : 'MEAL_ATTENDANCE_CREATED',
            entity_type: 'MealAttendance',
            entity_id: attendance.id,
            diff: {
              bulk: true,
              targetMemberId: update.memberId,
              mealId,
              date: dateKey,
              mealName: update.mealName,
              before: before
                ? {
                    status: before.status,
                    guests: Number(before.guests),
                    mealCount: mealCountFromAttendance(update.mealName, before),
                  }
                : null,
              after: {
                status: update.normalized.status,
                guests: update.normalized.guests,
                mealCount: update.normalized.mealCount,
              },
            },
          });
        }

        if (auditRows.length) {
          await tx.auditLog.createMany({ data: auditRows });
        }
        return { saved, updatedCount: saved.length };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 20_000,
      },
    );

    const billingSync = committed.updatedCount
      ? await this.billReconciliation.reconcile(messId, scheduledDate)
      : 'SYNCED';
    return {
      date: dateKey,
      requestedCount: updates.length,
      updatedCount: committed.updatedCount,
      unchangedCount: updates.length - committed.updatedCount,
      affectedMemberCount: new Set(
        committed.saved.map((update) => update.memberId),
      ).size,
      billingSync,
      updates: committed.saved,
    };
  }

  async findAll(query: MealFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const pagination = paginationHelper(paginationOptions);
    const sortBy = MEAL_LIST_SORT_FIELDS.has(pagination.sortBy)
      ? pagination.sortBy
      : 'scheduled_date';
    const where = this.buildWhere(query);

    const [total, meals] = await Promise.all([
      this.prisma.meal.count({ where }),
      this.prisma.meal.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [sortBy]: pagination.sortOrder },
        include: mealInclude,
      }),
    ]);

    return {
      data: meals,
      meta: buildMeta(total, pagination.page, pagination.limit),
      totalMealCount: total,
    };
  }

  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: MealFilterDto,
  ) {
    await this.getMessAccessContext(messId, userId, role);
    return this.findAll({ ...query, messId });
  }

  async findOne(id: string, userId: string, role: string) {
    const meal = await this.prisma.meal.findUnique({
      where: { id },
      include: mealInclude,
    });
    if (!meal) {
      throw new NotFoundException(
        apiMessage('MEAL_ENTRY_NOT_FOUND', 'Meal entry not found'),
      );
    }

    await this.getMessAccessContext(meal.mess_id, userId, role);
    return meal;
  }

  async update(id: string, userId: string, role: string, dto: UpdateMealDto) {
    const meal = await this.prisma.meal.findUnique({ where: { id } });
    if (!meal) {
      throw new NotFoundException(
        apiMessage('MEAL_ENTRY_NOT_FOUND', 'Meal entry not found'),
      );
    }

    const context = await this.getMessAccessContext(meal.mess_id, userId, role);
    this.assertManager(context);
    await this.ensureActiveSubscription(meal.mess_id, role);

    const newDate = dto.date ? this.parseDate(dto.date) : meal.scheduled_date;
    try {
      const updatedMeal = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.meal.update({
          where: { id },
          data: {
            scheduled_date: dto.date ? newDate : undefined,
            status: dto.mealStatus,
            is_locked:
              dto.mealStatus === undefined
                ? undefined
                : dto.mealStatus === MealStatus.LOCKED,
            note: dto.note,
          },
          include: mealInclude,
        });

        await tx.auditLog.create({
          data: {
            mess_id: meal.mess_id,
            actor_id: userId,
            action: 'MEAL_AGGREGATE_UPDATED',
            entity_type: 'Meal',
            entity_id: meal.id,
            diff: {
              before: {
                date: meal.scheduled_date.toISOString().slice(0, 10),
                status: meal.status,
                isLocked: meal.is_locked,
                note: meal.note,
              },
              after: {
                date: updated.scheduled_date.toISOString().slice(0, 10),
                status: updated.status,
                isLocked: updated.is_locked,
                note: updated.note,
              },
            },
          },
        });
        return updated;
      });

      const billingSync = await this.billReconciliation.reconcile(
        meal.mess_id,
        meal.scheduled_date,
        updatedMeal.scheduled_date,
      );
      return { ...updatedMeal, billingSync };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A meal with the same name already exists on the target date',
        );
      }
      throw error;
    }
  }

  async setMealLock(
    messId: string,
    date: string,
    rawMealName: string,
    locked: boolean,
    userId: string,
    role: string,
  ) {
    const context = await this.getMessAccessContext(messId, userId, role);
    this.assertManager(context);
    await this.ensureActiveSubscription(messId, role);

    const mealName = this.parseMealName(rawMealName);
    const scheduledDate = this.parseDate(date);
    const meal = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.meal.upsert({
        where: {
          mess_id_name_scheduled_date: {
            mess_id: messId,
            name: mealName,
            scheduled_date: scheduledDate,
          },
        },
        update: {
          is_locked: locked,
          status: locked ? MealStatus.LOCKED : MealStatus.CONFIRMED,
        },
        create: {
          mess_id: messId,
          created_by: userId,
          name: mealName,
          scheduled_date: scheduledDate,
          is_locked: locked,
          status: locked ? MealStatus.LOCKED : MealStatus.CONFIRMED,
        },
        include: mealInclude,
      });
      await tx.auditLog.create({
        data: {
          mess_id: messId,
          actor_id: userId,
          action: locked ? 'MEAL_LOCKED' : 'MEAL_UNLOCKED',
          entity_type: 'Meal',
          entity_id: saved.id,
          diff: {
            date,
            mealName,
            isLocked: locked,
          },
        },
      });
      return saved;
    });

    const billingSync = await this.billReconciliation.reconcile(
      messId,
      scheduledDate,
    );
    return { ...meal, billingSync };
  }

  async remove(id: string, userId: string, role: string) {
    const meal = await this.prisma.meal.findUnique({
      where: { id },
      select: {
        id: true,
        mess_id: true,
        name: true,
        scheduled_date: true,
        status: true,
        is_locked: true,
        _count: { select: { attendances: true } },
      },
    });
    if (!meal) {
      throw new NotFoundException(
        apiMessage('MEAL_ENTRY_NOT_FOUND', 'Meal entry not found'),
      );
    }

    const context = await this.getMessAccessContext(meal.mess_id, userId, role);
    this.assertManager(context);
    await this.ensureActiveSubscription(meal.mess_id, role);

    await this.prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          mess_id: meal.mess_id,
          actor_id: userId,
          action: 'MEAL_DELETED',
          entity_type: 'Meal',
          entity_id: meal.id,
          diff: {
            date: meal.scheduled_date.toISOString().slice(0, 10),
            mealName: meal.name,
            status: meal.status,
            isLocked: meal.is_locked,
            deletedAttendances: meal._count.attendances,
          },
        },
      });
      await tx.meal.delete({ where: { id } });
    });

    const billingSync = await this.billReconciliation.reconcile(
      meal.mess_id,
      meal.scheduled_date,
    );
    return { deletedMealId: meal.id, billingSync };
  }

  async setMealDeadline(
    messId: string,
    userId: string,
    role: string,
    dto: SetMealDeadlineDto,
  ) {
    const context = await this.getMessAccessContext(messId, userId, role);
    this.assertManager(context);
    await this.ensureActiveSubscription(messId, role);

    try {
      assertValidMealWindow(dto.startTime, dto.endTime);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid meal decision window',
      );
    }

    const updated = await this.prisma.mess.update({
      where: { id: messId },
      data: {
        meal_off_deadline: dto.endTime,
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
      messId: updated.id,
      messName: updated.name,
      startTime: updated.meal_deadline_start,
      endTime: updated.meal_deadline_end,
      rule: 'Members decide the next-day meals during this window on the previous day',
    };
  }

  async getMealDeadlineInfo(
    messId: string,
    userId: string,
    role: string,
    date?: string,
  ) {
    const context = await this.getMessAccessContext(messId, userId, role);
    const targetDate = date?.slice(0, 10) ?? shiftDateKey(getDhakaDateKey(), 1);
    let window;
    try {
      window = getMealDecisionWindow(
        targetDate,
        context.mess.meal_deadline_start ?? DEFAULT_MEAL_WINDOW_START,
        context.mess.meal_deadline_end ?? DEFAULT_MEAL_WINDOW_END,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid target date',
      );
    }

    return {
      ...window,
      windowStart: window.windowStart.toISOString(),
      windowEnd: window.windowEnd.toISOString(),
      windowStartTime: window.windowStart.toISOString(),
      windowEndTime: window.windowEnd.toISOString(),
      canManage: context.canManage,
      canEdit: context.canManage || window.isWindowOpen,
      timeZone: MEAL_TIME_ZONE,
      rule: 'Submit the meal decision during the configured previous-day window',
    };
  }

  async getMealSettings(messId: string, userId: string, role: string) {
    const context = await this.getMessAccessContext(messId, userId, role);
    return this.mapMealSettings(context);
  }

  async updateMealSettings(
    messId: string,
    userId: string,
    role: string,
    dto: UpdateMealSettingsDto,
  ) {
    const context = await this.getMessAccessContext(messId, userId, role);
    this.assertManager(context);
    await this.ensureActiveSubscription(messId, role);

    const mess = await this.prisma.mess.update({
      where: { id: messId },
      data: {
        meal_default_status: dto.defaultStatus,
        meal_allow_no_meal: dto.allowNoMeal,
        meal_window_notification_enabled: dto.windowNotificationEnabled,
        meal_deadline_notification_enabled: dto.deadlineNotificationEnabled,
        meal_deadline_reminder_minutes: dto.deadlineReminderMinutes,
      },
      select: {
        id: true,
        name: true,
        created_by: true,
        meal_deadline_start: true,
        meal_deadline_end: true,
        meal_default_status: true,
        meal_allow_no_meal: true,
        meal_window_notification_enabled: true,
        meal_deadline_notification_enabled: true,
        meal_deadline_reminder_minutes: true,
      },
    });
    return this.mapMealSettings({ mess, canManage: true });
  }

  async getMealMembers(messId: string, userId: string, role: string) {
    const context = await this.getMessAccessContext(messId, userId, role);
    this.assertManager(context);
    return this.loadActiveMealMembers(messId, context.mess.created_by);
  }

  async getMealSummaryByMess(
    messId: string,
    userId: string,
    role: string,
    startDate?: string,
    endDate?: string,
  ) {
    const context = await this.getMessAccessContext(messId, userId, role);
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const members = await this.loadActiveMealMembers(
      messId,
      context.mess.created_by,
    );

    const [attendances, deposits, expenseTotal] = await Promise.all([
      this.prisma.mealAttendance.findMany({
        where: {
          member_id: { in: members.map((member) => member.user_id) },
          status: AttendanceStatus.ON,
          meal: {
            mess_id: messId,
            status: { not: MealStatus.CANCELLED },
            ...(dateFilter ? { scheduled_date: dateFilter } : {}),
          },
        },
        select: {
          member_id: true,
          guests: true,
          meal: { select: { name: true } },
        },
      }),
      this.prisma.deposit.groupBy({
        by: ['member_id'],
        where: {
          mess_id: messId,
          member_id: { in: members.map((member) => member.user_id) },
          confirmed_by: { not: null },
          ...(dateFilter ? { deposit_date: dateFilter } : {}),
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          mess_id: messId,
          status: 'CONFIRMED',
          category: { in: ['FOOD', 'GROCERY'] },
          ...(dateFilter ? { expense_date: dateFilter } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

    const mealsByMember = new Map<string, number>();
    for (const attendance of attendances) {
      const mealCount =
        getMealBaseValue(attendance.meal.name) + Number(attendance.guests);
      mealsByMember.set(
        attendance.member_id,
        (mealsByMember.get(attendance.member_id) ?? 0) + mealCount,
      );
    }
    const depositsByMember = new Map(
      deposits.map((deposit) => [
        deposit.member_id,
        Number(deposit._sum.amount ?? 0),
      ]),
    );

    const totalBazarCost = Number(expenseTotal._sum.amount ?? 0);
    const totalMeals = [...mealsByMember.values()].reduce(
      (sum, count) => sum + count,
      0,
    );
    const mealRate = totalMeals > 0 ? totalBazarCost / totalMeals : 0;

    return {
      summary: members.map((member) => {
        const memberMeals = mealsByMember.get(member.user_id) ?? 0;
        const totalDeposit = depositsByMember.get(member.user_id) ?? 0;
        const mealCost = memberMeals * mealRate;
        return {
          user: member.user,
          totalMeals: Number(memberMeals.toFixed(2)),
          totalDeposit,
          mealCost: Number(mealCost.toFixed(2)),
          balance: Number((totalDeposit - mealCost).toFixed(2)),
        };
      }),
      totalBazarCost,
      totalMeals: Number(totalMeals.toFixed(2)),
      mealRate: Number(mealRate.toFixed(2)),
    };
  }

  private async getMessAccessContext(
    messId: string,
    userId: string,
    role: string,
  ): Promise<MessAccessContext> {
    const [mess, membership] = await Promise.all([
      this.prisma.mess.findUnique({
        where: { id: messId },
        select: {
          id: true,
          name: true,
          created_by: true,
          meal_deadline_start: true,
          meal_deadline_end: true,
          meal_default_status: true,
          meal_allow_no_meal: true,
          meal_window_notification_enabled: true,
          meal_deadline_notification_enabled: true,
          meal_deadline_reminder_minutes: true,
        },
      }),
      this.prisma.messMembership.findUnique({
        where: {
          mess_id_user_id: { mess_id: messId, user_id: userId },
        },
        select: { role: true, is_active: true },
      }),
    ]);
    if (!mess) throw new NotFoundException('Mess not found');

    const isCreator = mess.created_by === userId;
    const hasMembership = Boolean(membership?.is_active);
    const isAdmin = role === 'ADMIN';
    if (!isAdmin && !isCreator && !hasMembership) {
      throw new ForbiddenException('You are not an active member of this mess');
    }

    return {
      mess,
      canManage:
        isAdmin ||
        isCreator ||
        (role === 'MANAGER' && hasMembership) ||
        (hasMembership && membership?.role === MembershipRole.MANAGER),
    };
  }

  private assertManager(context: MessAccessContext): void {
    if (!context.canManage) {
      throw new ForbiddenException(
        'Only a mess manager or admin can perform this action',
      );
    }
  }

  private async ensureActiveSubscription(
    messId: string,
    role: string,
  ): Promise<void> {
    if (!config.features.subscriptionEnabled || role === 'ADMIN') return;
    const subscription = await this.prisma.subscription.findUnique({
      where: { mess_id: messId },
      select: { status: true, end_date: true },
    });
    const active =
      subscription?.status === 'ACTIVE' &&
      (!subscription.end_date || subscription.end_date.getTime() >= Date.now());
    if (!active) {
      throw new ForbiddenException(
        'The mess subscription must be active to change meal data',
      );
    }
  }

  private assertMemberWindow(
    context: MessAccessContext,
    targetDate: string,
  ): void {
    let window;
    try {
      window = getMealDecisionWindow(
        targetDate,
        context.mess.meal_deadline_start,
        context.mess.meal_deadline_end,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid meal date',
      );
    }

    if (!window.isWindowOpen) {
      throw new ForbiddenException(
        `Member meal editing is available from ${this.formatMealWindowMoment(window.windowStart)} to ${this.formatMealWindowMoment(window.windowEnd)}.`,
      );
    }
  }

  private async assertActiveMealMember(
    messId: string,
    targetMemberId: string,
    context: MessAccessContext,
  ): Promise<void> {
    const [user, membership] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: targetMemberId },
        select: { is_active: true },
      }),
      this.prisma.messMembership.findUnique({
        where: {
          mess_id_user_id: {
            mess_id: messId,
            user_id: targetMemberId,
          },
        },
        select: { is_active: true },
      }),
    ]);
    const isCreator = context.mess.created_by === targetMemberId;
    if (!user?.is_active || (!isCreator && !membership?.is_active)) {
      throw new BadRequestException('Target member is not active in this mess');
    }
  }

  private normalizeAttendance(dto: CreateMealDto, context: MessAccessContext) {
    try {
      const normalized = normalizeMealAttendance({
        mealName: dto.mealName,
        status: dto.status,
        mealCount: dto.mealCount,
        guests: dto.guests,
        defaultStatus: context.mess.meal_default_status,
      });
      return {
        ...normalized,
        status: normalized.status as AttendanceStatus,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid meal attendance',
      );
    }
  }

  private parseDate(value: string): Date {
    try {
      return parseMealDate(value);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid meal date',
      );
    }
  }

  private parseMealName(value: string): MealName {
    const mealName = value.toUpperCase() as MealName;
    if (!Object.values(MealName).includes(mealName)) {
      throw new BadRequestException(
        'mealName must be BREAKFAST, LUNCH, or DINNER',
      );
    }
    return mealName;
  }

  private formatMealWindowMoment(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: MEAL_TIME_ZONE,
    }).format(date);
  }

  private mapMealSettings(context: MessAccessContext) {
    return {
      messId: context.mess.id,
      defaultStatus: context.mess.meal_default_status,
      allowNoMeal: context.mess.meal_allow_no_meal,
      windowNotificationEnabled: context.mess.meal_window_notification_enabled,
      deadlineNotificationEnabled:
        context.mess.meal_deadline_notification_enabled,
      deadlineReminderMinutes: context.mess.meal_deadline_reminder_minutes,
      canManage: context.canManage,
    };
  }

  private async loadActiveMealMembers(messId: string, creatorId: string) {
    const [memberships, creator] = await Promise.all([
      this.prisma.messMembership.findMany({
        where: {
          mess_id: messId,
          is_active: true,
          user: { is_active: true },
        },
        select: {
          id: true,
          user_id: true,
          role: true,
          is_active: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
            },
          },
        },
        orderBy: { user: { name: 'asc' } },
      }),
      this.prisma.user.findUnique({
        where: { id: creatorId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar_url: true,
          is_active: true,
        },
      }),
    ]);

    if (
      creator?.is_active &&
      !memberships.some((membership) => membership.user_id === creator.id)
    ) {
      memberships.unshift({
        id: creator.id,
        user_id: creator.id,
        role: MembershipRole.MANAGER,
        is_active: true,
        user: {
          id: creator.id,
          name: creator.name,
          email: creator.email,
          avatar_url: creator.avatar_url,
        },
      });
    }
    return memberships;
  }

  private buildDateFilter(
    startDate?: string,
    endDate?: string,
  ): Prisma.DateTimeFilter | undefined {
    if (!startDate && !endDate) return undefined;
    return {
      ...(startDate ? { gte: this.parseDate(startDate) } : {}),
      ...(endDate
        ? { lt: this.parseDate(shiftDateKey(endDate.slice(0, 10), 1)) }
        : {}),
    };
  }

  private buildWhere(query: MealFilterDto): Prisma.MealWhereInput {
    const where: Prisma.MealWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.userId) {
      where.attendances = { some: { member_id: query.userId } };
    }
    const dateFilter = this.buildDateFilter(query.startDate, query.endDate);
    if (dateFilter) where.scheduled_date = dateFilter;
    return where;
  }

  private isWithinPollInterval(now: Date, eventTime: Date): boolean {
    return (
      now.getTime() >= eventTime.getTime() &&
      now.getTime() < eventTime.getTime() + REMINDER_POLL_MS
    );
  }

  private async resolveNotificationUserIds(
    messId: string,
    creatorId: string,
  ): Promise<string[]> {
    const memberships = await this.prisma.messMembership.findMany({
      where: {
        mess_id: messId,
        is_active: true,
        user: { is_active: true },
      },
      select: { user_id: true },
    });
    return [
      ...new Set([
        creatorId,
        ...memberships.map((membership) => membership.user_id),
      ]),
    ];
  }

  private async sendWindowOpenedNotification(
    messId: string,
    messName: string,
    creatorId: string,
    targetDate: string,
    startTime: string,
    endTime: string,
  ): Promise<void> {
    const targetUserIds = await this.resolveNotificationUserIds(
      messId,
      creatorId,
    );
    await this.notificationService.createForMess(
      null,
      messId,
      'MEAL_UPDATE',
      `Meal decision window is open — ${messName}`,
      `Choose meals for ${targetDate} by ${endTime} today.`,
      {
        type: 'MEAL_WINDOW_OPENED',
        targetDate,
        startTime,
        endTime,
        timeZone: MEAL_TIME_ZONE,
      },
      targetUserIds,
      '/meals',
      `meal:window-opened:${messId}:${targetDate}:${startTime}:${endTime}`,
    );
  }

  private async sendDeadlineWarningNotification(
    messId: string,
    messName: string,
    creatorId: string,
    targetDate: string,
    endTime: string,
    leadMinutes: number,
  ): Promise<void> {
    const targetUserIds = await this.resolveNotificationUserIds(
      messId,
      creatorId,
    );
    await this.notificationService.createForMess(
      null,
      messId,
      'MEAL_UPDATE',
      `Meal decision deadline approaching — ${messName}`,
      `You have ${leadMinutes} minutes to choose meals for ${targetDate}. The window closes at ${endTime}.`,
      {
        type: 'MEAL_DEADLINE_WARNING',
        targetDate,
        endTime,
        leadMinutes,
        timeZone: MEAL_TIME_ZONE,
      },
      targetUserIds,
      '/meals',
      `meal:deadline-warning:${messId}:${targetDate}:${endTime}:${leadMinutes}`,
    );
  }

  private schedulerErrorMessage(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P1001'
    ) {
      return 'database is not reachable';
    }

    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("Can't reach database server") ||
      message.includes('DatabaseNotReachable')
    ) {
      return 'database is not reachable';
    }
    return message;
  }
}
