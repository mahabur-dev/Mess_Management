import { HttpException, Injectable } from '@nestjs/common';
import {
  BazarDateStatus,
  BazarDutySlotStatus,
  BazarFrequency,
  BazarRequestStatus,
  BazarScheduleStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import {
  AddBazarDateDto,
  AssignBazarSlotDto,
  BazarMonthQueryDto,
  BazarRequestQueryDto,
  ChangeBazarDateStatusDto,
  CreateBazarSwapDto,
  GenerateBazarScheduleDto,
  MoveBazarDutyDto,
  ReleaseBazarSlotDto,
  ReviewBazarRequestDto,
  UpdateBazarDateCapacityDto,
  UpsertBazarScheduleSettingDto,
} from './dto/bazar-schedule.dto';
import {
  bazarDate,
  currentDhakaMonth,
  dateKey,
  daysUntil,
  dhakaDateKey,
  generateBazarDays,
  recommendedDutyCount,
} from './bazar-schedule.policy';

const memberSelect = {
  id: true,
  name: true,
  email: true,
  avatar_url: true,
} as const;

const scheduleInclude = {
  mess: { select: { id: true, name: true, created_by: true } },
  dates: {
    orderBy: { duty_date: 'asc' as const },
    include: {
      slots: {
        orderBy: { slot_number: 'asc' as const },
        include: { assigned_member: { select: memberSelect } },
      },
    },
  },
} as const;

const swapInclude = {
  requester: { select: memberSelect },
  target_member: { select: memberSelect },
  requester_slot: {
    include: { bazar_date: true, assigned_member: { select: memberSelect } },
  },
  target_slot: {
    include: { bazar_date: true, assigned_member: { select: memberSelect } },
  },
} as const;

const releaseInclude = {
  requester: { select: memberSelect },
  reviewer: { select: memberSelect },
  slot: {
    include: { bazar_date: true, assigned_member: { select: memberSelect } },
  },
} as const;

// A full month can create hundreds of duty slots in one atomic operation.
// Remote Postgres connections can exceed Prisma's 5-second interactive
// transaction default even though the database work is healthy.
const SCHEDULE_GENERATION_MAX_WAIT_MS = 10_000;
const SCHEDULE_GENERATION_TIMEOUT_MS = 30_000;

@Injectable()
export class BazarScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async upsertSettings(
    messId: string,
    userId: string,
    role: string,
    dto: UpsertBazarScheduleSettingDto,
  ) {
    await this.assertManager(messId, userId, role);
    this.validatePattern(dto.frequency, dto.weekdays, dto.customDays);

    const weekdays = this.uniqueSorted(dto.weekdays ?? []);
    const customDays = this.uniqueSorted(dto.customDays ?? []);
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.bazarScheduleSetting.findUnique({
        where: { mess_id: messId },
      });
      const setting = await tx.bazarScheduleSetting.upsert({
        where: { mess_id: messId },
        create: {
          mess_id: messId,
          frequency: dto.frequency,
          weekdays,
          custom_days: customDays,
          default_members_per_date: dto.defaultMembersPerDate,
          duty_limit: dto.dutyLimit,
          include_manager: dto.includeManager,
          release_notice_days: dto.releaseNoticeDays,
          strict_fairness: dto.strictFairness ?? false,
          updated_by: userId,
        },
        update: {
          frequency: dto.frequency,
          weekdays,
          custom_days: customDays,
          default_members_per_date: dto.defaultMembersPerDate,
          duty_limit: dto.dutyLimit,
          include_manager: dto.includeManager,
          release_notice_days: dto.releaseNoticeDays,
          strict_fairness: dto.strictFairness ?? false,
          updated_by: userId,
        },
      });
      await this.audit(
        tx,
        messId,
        userId,
        'BAZAR_SETTINGS_UPDATED',
        'BazarScheduleSetting',
        setting.id,
        {
          before,
          after: setting,
          note: 'Changes apply only to schedules generated after this update.',
        },
      );
      return setting;
    });
  }

  async getSettings(messId: string, userId: string, role: string) {
    await this.assertMessAccess(messId, userId, role);
    const setting = await this.prisma.bazarScheduleSetting.findUnique({
      where: { mess_id: messId },
    });
    if (!setting)
      throw new HttpException('Bazar schedule settings not found', 404);
    return setting;
  }

  async generate(userId: string, role: string, dto: GenerateBazarScheduleDto) {
    const mess = await this.assertManager(dto.messId, userId, role);
    const current = currentDhakaMonth();
    if (dto.year !== current.year || dto.month !== current.month) {
      throw new HttpException(
        'A bazar schedule can only be generated for the current month',
        400,
      );
    }

    const setting = await this.prisma.bazarScheduleSetting.findUnique({
      where: { mess_id: dto.messId },
    });
    if (!setting) {
      throw new HttpException(
        'Configure bazar schedule settings before generating a schedule',
        400,
      );
    }
    this.validatePattern(
      setting.frequency,
      setting.weekdays,
      setting.custom_days,
    );

    const days = generateBazarDays(dto.year, dto.month, {
      frequency: setting.frequency,
      weekdays: setting.weekdays,
      customDays: setting.custom_days,
    });
    if (days.length === 0)
      throw new HttpException(
        'The selected settings produce no bazar dates',
        400,
      );

    const overrideMap = new Map<number, number>();
    for (const override of dto.dateMemberOverrides ?? []) {
      if (!days.includes(override.day)) {
        throw new HttpException(
          `Day ${override.day} is not a generated bazar date`,
          400,
        );
      }
      if (overrideMap.has(override.day)) {
        throw new HttpException(
          `Day ${override.day} has more than one member override`,
          400,
        );
      }
      overrideMap.set(override.day, override.requiredMembers);
    }

    const eligibleMembers = await this.resolveEligibleMembers(
      dto.messId,
      setting.include_manager,
    );
    const totalSlots = days.reduce(
      (total, day) =>
        total + (overrideMap.get(day) ?? setting.default_members_per_date),
      0,
    );
    const recommendation = recommendedDutyCount(
      totalSlots,
      eligibleMembers.length,
    );
    const today = dhakaDateKey();

    let schedule;
    try {
      schedule = await this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.bazarSchedule.findUnique({
            where: {
              mess_id_year_month: {
                mess_id: dto.messId,
                year: dto.year,
                month: dto.month,
              },
            },
          });
          if (existing)
            throw new HttpException(
              "This month's bazar schedule is already generated",
              409,
            );

          const aggregate = await tx.bazarSchedule.aggregate({
            where: { mess_id: dto.messId },
            _max: { version: true },
          });
          await tx.bazarSchedule.updateMany({
            where: { mess_id: dto.messId, status: BazarScheduleStatus.ACTIVE },
            data: {
              status: BazarScheduleStatus.FINISHED,
              finished_at: new Date(),
            },
          });

          const created = await tx.bazarSchedule.create({
            data: {
              mess_id: dto.messId,
              year: dto.year,
              month: dto.month,
              version: (aggregate._max.version ?? 0) + 1,
              frequency: setting.frequency,
              weekdays: setting.weekdays,
              custom_days: setting.custom_days,
              default_members_per_date: setting.default_members_per_date,
              duty_limit: setting.duty_limit,
              include_manager: setting.include_manager,
              release_notice_days: setting.release_notice_days,
              strict_fairness: setting.strict_fairness,
              eligible_member_count: eligibleMembers.length,
              recommended_duty_count: recommendation,
              created_by: userId,
              dates: {
                create: days.map((day) => {
                  const requiredMembers =
                    overrideMap.get(day) ?? setting.default_members_per_date;
                  const dutyDate = bazarDate(dto.year, dto.month, day);
                  const isPast = dateKey(dutyDate) < today;
                  return {
                    duty_date: dutyDate,
                    required_members: requiredMembers,
                    status: isPast
                      ? BazarDateStatus.COMPLETED
                      : BazarDateStatus.OPEN,
                    status_reason: isPast
                      ? 'Schedule was generated after this date'
                      : null,
                    slots: {
                      create: Array.from(
                        { length: requiredMembers },
                        (_, index) => ({
                          slot_number: index + 1,
                          status: isPast
                            ? BazarDutySlotStatus.CLOSED
                            : BazarDutySlotStatus.AVAILABLE,
                        }),
                      ),
                    },
                  };
                }),
              },
            },
            include: scheduleInclude,
          });
          await this.audit(
            tx,
            dto.messId,
            userId,
            'BAZAR_SCHEDULE_GENERATED',
            'BazarSchedule',
            created.id,
            {
              version: created.version,
              year: dto.year,
              month: dto.month,
              totalDates: days.length,
              totalSlots,
              eligibleMemberCount: eligibleMembers.length,
              recommendedDutyCount: recommendation,
            },
          );
          return created;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: SCHEDULE_GENERATION_MAX_WAIT_MS,
          timeout: SCHEDULE_GENERATION_TIMEOUT_MS,
        },
      );
    } catch (error) {
      this.rethrowConcurrency(
        error,
        "This month's bazar schedule is already generated",
      );
    }

    const targetUserIds = eligibleMembers.map((member) => member.id);
    void this.notify(
      null,
      dto.messId,
      targetUserIds,
      'Bazar schedule is available',
      `${mess.name}: ${dto.month}/${dto.year} bazar duties are ready to select.`,
      {
        source: 'BAZAR_SCHEDULE_GENERATED',
        scheduleId: schedule.id,
        messName: mess.name,
        month: dto.month,
        year: dto.year,
      },
      `bazar:schedule:${schedule.id}`,
    );
    return this.buildOverview(schedule, eligibleMembers);
  }

  async getMonth(
    messId: string,
    userId: string,
    role: string,
    query: BazarMonthQueryDto,
  ) {
    await this.assertMessAccess(messId, userId, role);
    const current = currentDhakaMonth();
    const year = query.year ?? current.year;
    const month = query.month ?? current.month;
    const schedule = await this.prisma.bazarSchedule.findUnique({
      where: { mess_id_year_month: { mess_id: messId, year, month } },
      include: scheduleInclude,
    });
    if (!schedule) throw new HttpException('Bazar schedule not found', 404);
    const eligibleMembers = await this.resolveEligibleMembers(
      messId,
      schedule.include_manager,
    );
    return this.buildOverview(schedule, eligibleMembers, userId);
  }

  async getHistory(messId: string, userId: string, role: string) {
    await this.assertMessAccess(messId, userId, role);
    return this.prisma.bazarSchedule.findMany({
      where: { mess_id: messId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      select: {
        id: true,
        year: true,
        month: true,
        version: true,
        status: true,
        frequency: true,
        duty_limit: true,
        eligible_member_count: true,
        recommended_duty_count: true,
        created_at: true,
        finished_at: true,
        _count: { select: { dates: true } },
      },
    });
  }

  async claimSlot(slotId: string, userId: string, role: string) {
    const context = await this.getSlotContext(slotId);
    await this.assertMessAccess(
      context.bazar_date.schedule.mess_id,
      userId,
      role,
    );
    await this.assertEligibleMember(context.bazar_date.schedule, userId);
    this.assertMutableSlot(context);
    const eligibleMembers = context.bazar_date.schedule.strict_fairness
      ? await this.resolveEligibleMembers(
          context.bazar_date.schedule.mess_id,
          context.bazar_date.schedule.include_manager,
        )
      : [];

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const slot = await tx.bazarDutySlot.findUnique({
            where: { id: slotId },
            include: { bazar_date: { include: { schedule: true } } },
          });
          if (!slot) throw new HttpException('Bazar duty slot not found', 404);
          this.assertMutableSlot(slot);
          if (
            slot.status !== BazarDutySlotStatus.AVAILABLE ||
            slot.assigned_member_id
          ) {
            throw new HttpException(
              'This bazar duty slot is no longer available',
              409,
            );
          }

          const sameDate = await tx.bazarDutySlot.count({
            where: {
              bazar_date_id: slot.bazar_date_id,
              assigned_member_id: userId,
            },
          });
          if (sameDate > 0)
            throw new HttpException(
              'You already have a duty on this bazar date',
              409,
            );

          const assignedCount = await tx.bazarDutySlot.count({
            where: {
              assigned_member_id: userId,
              status: BazarDutySlotStatus.ASSIGNED,
              bazar_date: { schedule_id: slot.bazar_date.schedule_id },
            },
          });
          if (assignedCount >= slot.bazar_date.schedule.duty_limit) {
            throw new HttpException(
              'Your monthly bazar duty limit is already reached',
              409,
            );
          }

          if (
            slot.bazar_date.schedule.strict_fairness &&
            eligibleMembers.length > 0
          ) {
            const grouped = await tx.bazarDutySlot.groupBy({
              by: ['assigned_member_id'],
              where: {
                bazar_date: { schedule_id: slot.bazar_date.schedule_id },
                status: BazarDutySlotStatus.ASSIGNED,
                assigned_member_id: {
                  in: eligibleMembers.map((member) => member.id),
                },
              },
              _count: { _all: true },
            });
            const counts = new Map(
              grouped.map((row) => [row.assigned_member_id, row._count._all]),
            );
            const minimum = Math.min(
              ...eligibleMembers.map((member) => counts.get(member.id) ?? 0),
            );
            if (assignedCount > minimum) {
              throw new HttpException(
                'Other members must select their fair share before you take an extra duty',
                409,
              );
            }
          }

          const result = await tx.bazarDutySlot.updateMany({
            where: {
              id: slotId,
              status: BazarDutySlotStatus.AVAILABLE,
              assigned_member_id: null,
            },
            data: {
              status: BazarDutySlotStatus.ASSIGNED,
              assigned_member_id: userId,
              assigned_by: userId,
              assigned_at: new Date(),
              last_reason: null,
            },
          });
          if (result.count !== 1)
            throw new HttpException(
              'This bazar duty slot was taken by another member',
              409,
            );
          await this.audit(
            tx,
            slot.bazar_date.schedule.mess_id,
            userId,
            'BAZAR_DUTY_CLAIMED',
            'BazarDutySlot',
            slotId,
            {
              date: dateKey(slot.bazar_date.duty_date),
              memberId: userId,
            },
          );
          return tx.bazarDutySlot.findUnique({
            where: { id: slotId },
            include: {
              bazar_date: true,
              assigned_member: { select: memberSelect },
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      this.rethrowConcurrency(
        error,
        'This bazar duty slot was taken by another member',
      );
    }
  }

  async assignSlot(
    slotId: string,
    managerId: string,
    role: string,
    dto: AssignBazarSlotDto,
  ) {
    const context = await this.getSlotContext(slotId);
    await this.assertManager(
      context.bazar_date.schedule.mess_id,
      managerId,
      role,
    );
    await this.assertEligibleMember(context.bazar_date.schedule, dto.memberId);
    this.assertMutableSlot(context);

    const previousMemberId = context.assigned_member_id;
    const currentDutyCount = await this.prisma.bazarDutySlot.count({
      where: {
        assigned_member_id: dto.memberId,
        status: BazarDutySlotStatus.ASSIGNED,
        bazar_date: { schedule_id: context.bazar_date.schedule_id },
      },
    });
    const limitBypassed =
      currentDutyCount >= context.bazar_date.schedule.duty_limit;

    try {
      const assigned = await this.prisma.$transaction(async (tx) => {
        const duplicate = await tx.bazarDutySlot.findFirst({
          where: {
            bazar_date_id: context.bazar_date_id,
            assigned_member_id: dto.memberId,
            NOT: { id: slotId },
          },
        });
        if (duplicate)
          throw new HttpException(
            'This member already has a duty on this date',
            409,
          );
        const updated = await tx.bazarDutySlot.update({
          where: { id: slotId },
          data: {
            status: BazarDutySlotStatus.ASSIGNED,
            assigned_member_id: dto.memberId,
            assigned_by: managerId,
            assigned_at: new Date(),
            last_reason: dto.reason,
          },
          include: {
            bazar_date: true,
            assigned_member: { select: memberSelect },
          },
        });
        await this.cancelPendingForSlot(tx, slotId, managerId);
        await this.audit(
          tx,
          context.bazar_date.schedule.mess_id,
          managerId,
          previousMemberId ? 'BAZAR_DUTY_REASSIGNED' : 'BAZAR_DUTY_ASSIGNED',
          'BazarDutySlot',
          slotId,
          {
            beforeMemberId: previousMemberId,
            afterMemberId: dto.memberId,
            reason: dto.reason ?? null,
            limitBypassed,
          },
        );
        return updated;
      });
      void this.notify(
        managerId,
        context.bazar_date.schedule.mess_id,
        [dto.memberId],
        'Bazar duty assigned',
        `You were assigned bazar duty for ${dateKey(context.bazar_date.duty_date)}.`,
        {
          source: 'BAZAR_DUTY_ASSIGNED',
          slotId,
          limitBypassed,
          dutyDate: dateKey(context.bazar_date.duty_date),
        },
      );
      return {
        ...assigned,
        warning: limitBypassed
          ? 'Manager assignment bypassed the member duty limit'
          : null,
      };
    } catch (error) {
      this.rethrowConcurrency(
        error,
        'The member could not be assigned to this slot',
      );
    }
  }

  async unassignSlot(
    slotId: string,
    managerId: string,
    role: string,
    dto: ReleaseBazarSlotDto,
  ) {
    const context = await this.getSlotContext(slotId);
    await this.assertManager(
      context.bazar_date.schedule.mess_id,
      managerId,
      role,
    );
    this.assertMutableSlot(context);
    if (!context.assigned_member_id)
      throw new HttpException('This slot is not assigned', 409);
    const previousMemberId = context.assigned_member_id;
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.bazarDutySlot.update({
        where: { id: slotId },
        data: {
          status: BazarDutySlotStatus.AVAILABLE,
          assigned_member_id: null,
          assigned_by: null,
          assigned_at: null,
          last_reason: dto.reason,
        },
        include: { bazar_date: true },
      });
      await this.cancelPendingForSlot(tx, slotId, managerId);
      await this.audit(
        tx,
        context.bazar_date.schedule.mess_id,
        managerId,
        'BAZAR_DUTY_UNASSIGNED',
        'BazarDutySlot',
        slotId,
        {
          previousMemberId,
          reason: dto.reason,
        },
      );
      return result;
    });
    void this.notify(
      managerId,
      context.bazar_date.schedule.mess_id,
      [previousMemberId],
      'Bazar duty changed',
      `Your bazar duty for ${dateKey(context.bazar_date.duty_date)} was released by the manager.`,
      {
        source: 'BAZAR_DUTY_UNASSIGNED',
        slotId,
        dutyDate: dateKey(context.bazar_date.duty_date),
      },
    );
    return updated;
  }

  async requestRelease(
    slotId: string,
    userId: string,
    role: string,
    dto: ReleaseBazarSlotDto,
  ) {
    const context = await this.getSlotContext(slotId);
    const mess = await this.assertMessAccess(
      context.bazar_date.schedule.mess_id,
      userId,
      role,
    );
    this.assertMutableSlot(context);
    if (context.assigned_member_id !== userId)
      throw new HttpException('You can only release your own bazar duty', 403);
    this.assertDutyChangeNotice(context);

    let request;
    try {
      request = await this.prisma.$transaction(
        async (tx) => {
          const pending = await tx.bazarReleaseRequest.findFirst({
            where: { slot_id: slotId, status: BazarRequestStatus.PENDING },
          });
          if (pending)
            throw new HttpException(
              'A release request is already pending for this duty',
              409,
            );
          const created = await tx.bazarReleaseRequest.create({
            data: {
              mess_id: context.bazar_date.schedule.mess_id,
              schedule_id: context.bazar_date.schedule_id,
              slot_id: slotId,
              requester_id: userId,
              status: BazarRequestStatus.APPROVED,
              reason: dto.reason,
              auto_approved: true,
              responded_at: new Date(),
            },
            include: releaseInclude,
          });
          const changed = await tx.bazarDutySlot.updateMany({
            where: {
              id: slotId,
              assigned_member_id: userId,
              status: BazarDutySlotStatus.ASSIGNED,
            },
            data: {
              status: BazarDutySlotStatus.AVAILABLE,
              assigned_member_id: null,
              assigned_by: null,
              assigned_at: null,
              last_reason: dto.reason,
            },
          });
          if (changed.count !== 1)
            throw new HttpException(
              'The duty assignment changed before it could be released',
              409,
            );
          await this.audit(
            tx,
            context.bazar_date.schedule.mess_id,
            userId,
            'BAZAR_DUTY_AUTO_RELEASED',
            'BazarReleaseRequest',
            created.id,
            {
              slotId,
              reason: dto.reason,
              automatic: true,
              releaseNoticeDays:
                context.bazar_date.schedule.release_notice_days,
            },
          );
          const hydrated = await tx.bazarReleaseRequest.findUnique({
            where: { id: created.id },
            include: releaseInclude,
          });
          return hydrated!;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      this.rethrowConcurrency(
        error,
        'The duty assignment changed before it could be released',
      );
    }
    void this.notify(
      userId,
      context.bazar_date.schedule.mess_id,
      [mess.created_by],
      'Bazar duty released',
      `${dateKey(context.bazar_date.duty_date)} duty was released with enough advance notice.`,
      {
        source: 'BAZAR_DUTY_AUTO_RELEASED',
        requestId: request.id,
        slotId,
        dutyDate: dateKey(context.bazar_date.duty_date),
      },
    );
    return request;
  }

  async moveOwnDuty(
    sourceSlotId: string,
    userId: string,
    role: string,
    dto: MoveBazarDutyDto,
  ) {
    if (sourceSlotId === dto.targetSlotId) {
      throw new HttpException('Select a different duty slot', 400);
    }

    const [sourceSlot, targetSlot] = await Promise.all([
      this.getSlotContext(sourceSlotId),
      this.getSlotContext(dto.targetSlotId),
    ]);
    const schedule = sourceSlot.bazar_date.schedule;
    const mess = await this.assertMessAccess(schedule.mess_id, userId, role);
    await this.assertEligibleMember(schedule, userId);
    this.assertMoveSlots(sourceSlot, targetSlot, userId);

    const fromDate = dateKey(sourceSlot.bazar_date.duty_date);
    const toDate = dateKey(targetSlot.bazar_date.duty_date);

    try {
      const moved = await this.prisma.$transaction(
        async (tx) => {
          const [currentSource, currentTarget] = await Promise.all([
            tx.bazarDutySlot.findUnique({
              where: { id: sourceSlotId },
              include: { bazar_date: { include: { schedule: true } } },
            }),
            tx.bazarDutySlot.findUnique({
              where: { id: dto.targetSlotId },
              include: { bazar_date: { include: { schedule: true } } },
            }),
          ]);
          if (!currentSource || !currentTarget) {
            throw new HttpException(
              'A selected bazar duty no longer exists',
              409,
            );
          }
          this.assertMoveSlots(currentSource, currentTarget, userId);

          const duplicateOnTargetDate = await tx.bazarDutySlot.findFirst({
            where: {
              bazar_date_id: currentTarget.bazar_date_id,
              assigned_member_id: userId,
              NOT: { id: currentTarget.id },
            },
          });
          if (duplicateOnTargetDate) {
            throw new HttpException(
              'You already have a duty on the target bazar date',
              409,
            );
          }

          const released = await tx.bazarDutySlot.updateMany({
            where: {
              id: sourceSlotId,
              status: BazarDutySlotStatus.ASSIGNED,
              assigned_member_id: userId,
            },
            data: {
              status: BazarDutySlotStatus.AVAILABLE,
              assigned_member_id: null,
              assigned_by: null,
              assigned_at: null,
              last_reason: dto.reason ?? null,
            },
          });
          if (released.count !== 1) {
            throw new HttpException(
              'Your source duty assignment changed before it could be moved',
              409,
            );
          }

          const assigned = await tx.bazarDutySlot.updateMany({
            where: {
              id: dto.targetSlotId,
              status: BazarDutySlotStatus.AVAILABLE,
              assigned_member_id: null,
            },
            data: {
              status: BazarDutySlotStatus.ASSIGNED,
              assigned_member_id: userId,
              assigned_by: userId,
              assigned_at: new Date(),
              last_reason: dto.reason ?? null,
            },
          });
          if (assigned.count !== 1) {
            throw new HttpException(
              'The target duty slot was taken before your duty could be moved',
              409,
            );
          }

          await this.cancelPendingForSlot(tx, sourceSlotId, userId);
          await this.cancelPendingForSlot(tx, dto.targetSlotId, userId);
          await this.audit(
            tx,
            schedule.mess_id,
            userId,
            'BAZAR_DUTY_MOVED',
            'BazarDutySlot',
            sourceSlotId,
            {
              sourceSlotId,
              targetSlotId: dto.targetSlotId,
              fromDate,
              toDate,
              reason: dto.reason ?? null,
            },
          );

          const [source, target] = await Promise.all([
            tx.bazarDutySlot.findUnique({
              where: { id: sourceSlotId },
              include: {
                bazar_date: true,
                assigned_member: { select: memberSelect },
              },
            }),
            tx.bazarDutySlot.findUnique({
              where: { id: dto.targetSlotId },
              include: {
                bazar_date: true,
                assigned_member: { select: memberSelect },
              },
            }),
          ]);
          return { source, target };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if (mess.created_by !== userId) {
        void this.notify(
          userId,
          schedule.mess_id,
          [mess.created_by],
          'Bazar duty moved',
          `A member moved their bazar duty from ${fromDate} to ${toDate}.`,
          {
            source: 'BAZAR_DUTY_MOVED',
            sourceSlotId,
            targetSlotId: dto.targetSlotId,
            fromDate,
            toDate,
          },
        );
      }
      return moved;
    } catch (error) {
      this.rethrowConcurrency(
        error,
        'The duty could not be moved because an assignment changed',
      );
    }
  }

  async reviewRelease(
    requestId: string,
    managerId: string,
    role: string,
    dto: ReviewBazarRequestDto,
  ) {
    const existing = await this.prisma.bazarReleaseRequest.findUnique({
      where: { id: requestId },
      include: {
        slot: { include: { bazar_date: { include: { schedule: true } } } },
      },
    });
    if (!existing)
      throw new HttpException('Bazar release request not found', 404);
    await this.assertManager(existing.mess_id, managerId, role);
    if (existing.status !== BazarRequestStatus.PENDING)
      throw new HttpException(
        'This release request has already been resolved',
        409,
      );
    if (dto.approve) {
      this.assertMutableSlot(existing.slot);
      this.assertDutyChangeNotice(existing.slot);
    }

    const status = dto.approve
      ? BazarRequestStatus.APPROVED
      : BazarRequestStatus.REJECTED;
    const reviewed = await this.prisma.$transaction(async (tx) => {
      if (dto.approve) {
        const changed = await tx.bazarDutySlot.updateMany({
          where: {
            id: existing.slot_id,
            assigned_member_id: existing.requester_id,
            status: BazarDutySlotStatus.ASSIGNED,
          },
          data: {
            status: BazarDutySlotStatus.AVAILABLE,
            assigned_member_id: null,
            assigned_by: null,
            assigned_at: null,
            last_reason: existing.reason,
          },
        });
        if (changed.count !== 1)
          throw new HttpException('The duty assignment has changed', 409);
      }
      const request = await tx.bazarReleaseRequest.update({
        where: { id: requestId },
        data: { status, reviewer_id: managerId, responded_at: new Date() },
        include: releaseInclude,
      });
      await this.audit(
        tx,
        existing.mess_id,
        managerId,
        dto.approve ? 'BAZAR_RELEASE_APPROVED' : 'BAZAR_RELEASE_REJECTED',
        'BazarReleaseRequest',
        requestId,
        {
          reason: dto.reason ?? null,
        },
      );
      return request;
    });
    void this.notify(
      managerId,
      existing.mess_id,
      [existing.requester_id],
      dto.approve ? 'Bazar release approved' : 'Bazar release rejected',
      `Your release request for ${dateKey(existing.slot.bazar_date.duty_date)} was ${dto.approve ? 'approved' : 'rejected'}.`,
      {
        source: dto.approve
          ? 'BAZAR_RELEASE_APPROVED'
          : 'BAZAR_RELEASE_REJECTED',
        requestId,
        dutyDate: dateKey(existing.slot.bazar_date.duty_date),
      },
    );
    return reviewed;
  }

  async createSwap(userId: string, role: string, dto: CreateBazarSwapDto) {
    if (dto.requesterSlotId === dto.targetSlotId)
      throw new HttpException('Select two different duty slots', 400);
    const [ownSlot, targetSlot] = await Promise.all([
      this.getSlotContext(dto.requesterSlotId),
      this.getSlotContext(dto.targetSlotId),
    ]);
    const schedule = ownSlot.bazar_date.schedule;
    const mess = await this.assertMessAccess(schedule.mess_id, userId, role);
    if (targetSlot.bazar_date.schedule_id !== ownSlot.bazar_date.schedule_id) {
      throw new HttpException(
        'Both duties must belong to the same monthly schedule',
        400,
      );
    }
    if (ownSlot.bazar_date_id === targetSlot.bazar_date_id)
      throw new HttpException('Duties on the same date cannot be swapped', 400);
    this.assertMutableSlot(ownSlot);
    this.assertMutableSlot(targetSlot);
    this.assertSwapNotice(ownSlot);
    this.assertSwapNotice(targetSlot);
    if (ownSlot.assigned_member_id !== userId)
      throw new HttpException('You can only swap your own bazar duty', 403);
    if (
      !targetSlot.assigned_member_id ||
      targetSlot.assigned_member_id === userId
    ) {
      throw new HttpException(
        'The target slot must be assigned to another member',
        400,
      );
    }

    let request;
    try {
      request = await this.prisma.$transaction(
        async (tx) => {
          const conflicting = await tx.bazarSwapRequest.findFirst({
            where: {
              status: BazarRequestStatus.PENDING,
              OR: [
                {
                  requester_slot_id: {
                    in: [dto.requesterSlotId, dto.targetSlotId],
                  },
                },
                {
                  target_slot_id: {
                    in: [dto.requesterSlotId, dto.targetSlotId],
                  },
                },
              ],
            },
          });
          if (conflicting)
            throw new HttpException(
              'One of these duties already has a pending swap request',
              409,
            );
          const created = await tx.bazarSwapRequest.create({
            data: {
              mess_id: schedule.mess_id,
              schedule_id: schedule.id,
              requester_id: userId,
              target_member_id: targetSlot.assigned_member_id!,
              requester_slot_id: dto.requesterSlotId,
              target_slot_id: dto.targetSlotId,
              reason: dto.reason,
            },
            include: swapInclude,
          });
          await this.audit(
            tx,
            schedule.mess_id,
            userId,
            'BAZAR_SWAP_REQUESTED',
            'BazarSwapRequest',
            created.id,
            {
              requesterSlotId: dto.requesterSlotId,
              targetSlotId: dto.targetSlotId,
              reason: dto.reason ?? null,
            },
          );
          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      this.rethrowConcurrency(
        error,
        'One of these duties already has a pending swap request',
      );
    }
    void this.notify(
      userId,
      schedule.mess_id,
      [targetSlot.assigned_member_id, mess.created_by],
      'Bazar duty swap requested',
      `${dateKey(ownSlot.bazar_date.duty_date)} and ${dateKey(targetSlot.bazar_date.duty_date)} duties were requested for swap.`,
      {
        source: 'BAZAR_SWAP_REQUESTED',
        requestId: request.id,
        requesterDate: dateKey(ownSlot.bazar_date.duty_date),
        targetDate: dateKey(targetSlot.bazar_date.duty_date),
      },
    );
    return request;
  }

  async reviewSwap(
    requestId: string,
    userId: string,
    role: string,
    dto: ReviewBazarRequestDto,
  ) {
    const existing = await this.prisma.bazarSwapRequest.findUnique({
      where: { id: requestId },
      include: {
        requester_slot: {
          include: { bazar_date: { include: { schedule: true } } },
        },
        target_slot: { include: { bazar_date: true } },
      },
    });
    if (!existing) throw new HttpException('Bazar swap request not found', 404);
    const mess = await this.assertMessAccess(existing.mess_id, userId, role);
    if (existing.target_member_id !== userId)
      throw new HttpException(
        'Only the requested member can respond to this swap',
        403,
      );
    if (existing.status !== BazarRequestStatus.PENDING)
      throw new HttpException(
        'This swap request has already been resolved',
        409,
      );

    const reviewed = await this.prisma.$transaction(
      async (tx) => {
        const [requesterSlot, targetSlot] = await Promise.all([
          tx.bazarDutySlot.findUnique({
            where: { id: existing.requester_slot_id },
            include: { bazar_date: true },
          }),
          tx.bazarDutySlot.findUnique({
            where: { id: existing.target_slot_id },
            include: { bazar_date: true },
          }),
        ]);
        if (!requesterSlot || !targetSlot)
          throw new HttpException('A duty in this swap no longer exists', 409);
        if (dto.approve) {
          if (
            requesterSlot.assigned_member_id !== existing.requester_id ||
            targetSlot.assigned_member_id !== existing.target_member_id
          ) {
            throw new HttpException(
              'A duty assignment changed after this request was sent',
              409,
            );
          }
          if (
            daysUntil(requesterSlot.bazar_date.duty_date) < 1 ||
            daysUntil(targetSlot.bazar_date.duty_date) < 1
          ) {
            throw new HttpException(
              'Bazar duties can only be swapped at least one day in advance',
              409,
            );
          }
          const duplicateOnRequesterDate = await tx.bazarDutySlot.findFirst({
            where: {
              bazar_date_id: requesterSlot.bazar_date_id,
              assigned_member_id: existing.target_member_id,
              NOT: { id: requesterSlot.id },
            },
          });
          const duplicateOnTargetDate = await tx.bazarDutySlot.findFirst({
            where: {
              bazar_date_id: targetSlot.bazar_date_id,
              assigned_member_id: existing.requester_id,
              NOT: { id: targetSlot.id },
            },
          });
          if (duplicateOnRequesterDate || duplicateOnTargetDate) {
            throw new HttpException(
              'The swap would give a member two duties on the same date',
              409,
            );
          }
          await tx.bazarDutySlot.update({
            where: { id: requesterSlot.id },
            data: {
              assigned_member_id: existing.target_member_id,
              assigned_by: userId,
              assigned_at: new Date(),
              last_reason: dto.reason ?? existing.reason,
            },
          });
          await tx.bazarDutySlot.update({
            where: { id: targetSlot.id },
            data: {
              assigned_member_id: existing.requester_id,
              assigned_by: userId,
              assigned_at: new Date(),
              last_reason: dto.reason ?? existing.reason,
            },
          });
        }
        const status = dto.approve
          ? BazarRequestStatus.APPROVED
          : BazarRequestStatus.REJECTED;
        const request = await tx.bazarSwapRequest.update({
          where: { id: requestId },
          data: { status, responded_at: new Date() },
          include: swapInclude,
        });
        await this.audit(
          tx,
          existing.mess_id,
          userId,
          dto.approve ? 'BAZAR_SWAP_APPROVED' : 'BAZAR_SWAP_REJECTED',
          'BazarSwapRequest',
          requestId,
          {
            responseReason: dto.reason ?? null,
          },
        );
        return request;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    void this.notify(
      userId,
      existing.mess_id,
      [existing.requester_id, mess.created_by],
      dto.approve ? 'Bazar duty swap accepted' : 'Bazar duty swap declined',
      `The bazar duty swap was ${dto.approve ? 'accepted' : 'declined'}.`,
      {
        source: dto.approve ? 'BAZAR_SWAP_APPROVED' : 'BAZAR_SWAP_REJECTED',
        requestId,
        approved: dto.approve,
      },
    );
    return reviewed;
  }

  async cancelSwap(requestId: string, userId: string, role: string) {
    const existing = await this.prisma.bazarSwapRequest.findUnique({
      where: { id: requestId },
    });
    if (!existing) throw new HttpException('Bazar swap request not found', 404);
    const mess = await this.assertMessAccess(existing.mess_id, userId, role);
    if (existing.requester_id !== userId)
      throw new HttpException('Only the requester can cancel this swap', 403);
    if (existing.status !== BazarRequestStatus.PENDING)
      throw new HttpException(
        'This swap request can no longer be cancelled',
        409,
      );
    const cancelled = await this.prisma.$transaction(async (tx) => {
      const request = await tx.bazarSwapRequest.update({
        where: { id: requestId },
        data: {
          status: BazarRequestStatus.CANCELLED,
          cancelled_at: new Date(),
        },
        include: swapInclude,
      });
      await this.audit(
        tx,
        existing.mess_id,
        userId,
        'BAZAR_SWAP_CANCELLED',
        'BazarSwapRequest',
        requestId,
        {},
      );
      return request;
    });
    void this.notify(
      userId,
      existing.mess_id,
      [existing.target_member_id, mess.created_by],
      'Bazar duty swap cancelled',
      'The pending bazar duty swap request was cancelled.',
      {
        source: 'BAZAR_SWAP_CANCELLED',
        requestId,
      },
    );
    return cancelled;
  }

  async listSwapRequests(
    messId: string,
    userId: string,
    role: string,
    query: BazarRequestQueryDto,
  ) {
    const mess = await this.assertMessAccess(messId, userId, role);
    const isManager = role === 'ADMIN' || mess.created_by === userId;
    return this.prisma.bazarSwapRequest.findMany({
      where: {
        mess_id: messId,
        ...(query.status && { status: query.status }),
        ...(!isManager && {
          OR: [{ requester_id: userId }, { target_member_id: userId }],
        }),
      },
      orderBy: { created_at: 'desc' },
      include: swapInclude,
    });
  }

  async listReleaseRequests(
    messId: string,
    userId: string,
    role: string,
    query: BazarRequestQueryDto,
  ) {
    const mess = await this.assertMessAccess(messId, userId, role);
    const isManager = role === 'ADMIN' || mess.created_by === userId;
    return this.prisma.bazarReleaseRequest.findMany({
      where: {
        mess_id: messId,
        ...(query.status && { status: query.status }),
        ...(!isManager && { requester_id: userId }),
      },
      orderBy: { created_at: 'desc' },
      include: releaseInclude,
    });
  }

  async addDate(
    scheduleId: string,
    managerId: string,
    role: string,
    dto: AddBazarDateDto,
  ) {
    const schedule = await this.prisma.bazarSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule) throw new HttpException('Bazar schedule not found', 404);
    await this.assertManager(schedule.mess_id, managerId, role);
    if (schedule.status !== BazarScheduleStatus.ACTIVE)
      throw new HttpException('Only the active schedule can be changed', 409);
    const parsed = new Date(`${dto.date.slice(0, 10)}T00:00:00.000Z`);
    if (
      parsed.getUTCFullYear() !== schedule.year ||
      parsed.getUTCMonth() + 1 !== schedule.month
    ) {
      throw new HttpException(
        'The date must be inside this schedule month',
        400,
      );
    }
    if (dateKey(parsed) < dhakaDateKey())
      throw new HttpException('Past bazar dates cannot be added', 400);
    const required = dto.requiredMembers ?? schedule.default_members_per_date;
    const created = await this.prisma.$transaction(async (tx) => {
      const date = await tx.bazarDate.create({
        data: {
          schedule_id: scheduleId,
          duty_date: parsed,
          required_members: required,
          status_reason: dto.reason,
          slots: {
            create: Array.from({ length: required }, (_, index) => ({
              slot_number: index + 1,
            })),
          },
        },
        include: { slots: true },
      });
      await this.audit(
        tx,
        schedule.mess_id,
        managerId,
        'BAZAR_DATE_ADDED',
        'BazarDate',
        date.id,
        {
          date: dto.date.slice(0, 10),
          requiredMembers: required,
          reason: dto.reason,
        },
      );
      return date;
    });
    return created;
  }

  async changeDateStatus(
    dateId: string,
    managerId: string,
    role: string,
    dto: ChangeBazarDateStatusDto,
  ) {
    if (
      dto.status !== BazarDateStatus.OPEN &&
      dto.status !== BazarDateStatus.CLOSED
    ) {
      throw new HttpException(
        'Manager can only open or close a bazar date',
        400,
      );
    }
    const date = await this.getDateContext(dateId);
    await this.assertManager(date.schedule.mess_id, managerId, role);
    this.assertMutableDate(date);
    const assigned = date.slots.filter(
      (slot) => slot.status === BazarDutySlotStatus.ASSIGNED,
    ).length;
    if (dto.status === BazarDateStatus.CLOSED && assigned > 0) {
      throw new HttpException(
        'Release or reassign all duties before closing this bazar date',
        409,
      );
    }
    return this.prisma.$transaction(async (tx) => {
      if (dto.status === BazarDateStatus.CLOSED) {
        await tx.bazarDutySlot.updateMany({
          where: {
            bazar_date_id: dateId,
            status: BazarDutySlotStatus.AVAILABLE,
          },
          data: { status: BazarDutySlotStatus.CLOSED, last_reason: dto.reason },
        });
      } else {
        const toOpen = date.slots
          .filter((slot) => slot.status === BazarDutySlotStatus.CLOSED)
          .slice(0, date.required_members);
        await tx.bazarDutySlot.updateMany({
          where: { id: { in: toOpen.map((slot) => slot.id) } },
          data: {
            status: BazarDutySlotStatus.AVAILABLE,
            last_reason: dto.reason,
          },
        });
      }
      const updated = await tx.bazarDate.update({
        where: { id: dateId },
        data: { status: dto.status, status_reason: dto.reason },
        include: { slots: true },
      });
      await this.audit(
        tx,
        date.schedule.mess_id,
        managerId,
        dto.status === BazarDateStatus.CLOSED
          ? 'BAZAR_DATE_CLOSED'
          : 'BAZAR_DATE_OPENED',
        'BazarDate',
        dateId,
        {
          reason: dto.reason,
        },
      );
      return updated;
    });
  }

  async updateDateCapacity(
    dateId: string,
    managerId: string,
    role: string,
    dto: UpdateBazarDateCapacityDto,
  ) {
    const date = await this.getDateContext(dateId);
    await this.assertManager(date.schedule.mess_id, managerId, role);
    this.assertMutableDate(date);
    if (date.status !== BazarDateStatus.OPEN)
      throw new HttpException(
        'Open the bazar date before changing its capacity',
        409,
      );
    const activeSlots = date.slots.filter(
      (slot) => slot.status !== BazarDutySlotStatus.CLOSED,
    );
    const assigned = activeSlots.filter(
      (slot) => slot.status === BazarDutySlotStatus.ASSIGNED,
    );
    if (dto.requiredMembers < assigned.length) {
      throw new HttpException(
        'New capacity cannot be lower than the number of assigned members',
        409,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.requiredMembers < activeSlots.length) {
        const toClose = activeSlots
          .filter((slot) => slot.status === BazarDutySlotStatus.AVAILABLE)
          .slice(0, activeSlots.length - dto.requiredMembers);
        await tx.bazarDutySlot.updateMany({
          where: { id: { in: toClose.map((slot) => slot.id) } },
          data: { status: BazarDutySlotStatus.CLOSED, last_reason: dto.reason },
        });
      } else if (dto.requiredMembers > activeSlots.length) {
        let needed = dto.requiredMembers - activeSlots.length;
        const closed = date.slots.filter(
          (slot) => slot.status === BazarDutySlotStatus.CLOSED,
        );
        const reopen = closed.slice(0, needed);
        if (reopen.length) {
          await tx.bazarDutySlot.updateMany({
            where: { id: { in: reopen.map((slot) => slot.id) } },
            data: {
              status: BazarDutySlotStatus.AVAILABLE,
              last_reason: dto.reason,
            },
          });
          needed -= reopen.length;
        }
        if (needed > 0) {
          const maxSlot = Math.max(
            0,
            ...date.slots.map((slot) => slot.slot_number),
          );
          await tx.bazarDutySlot.createMany({
            data: Array.from({ length: needed }, (_, index) => ({
              bazar_date_id: dateId,
              slot_number: maxSlot + index + 1,
              last_reason: dto.reason,
            })),
          });
        }
      }
      const updated = await tx.bazarDate.update({
        where: { id: dateId },
        data: {
          required_members: dto.requiredMembers,
          status_reason: dto.reason,
        },
        include: {
          slots: {
            orderBy: { slot_number: 'asc' },
            include: { assigned_member: { select: memberSelect } },
          },
        },
      });
      await this.audit(
        tx,
        date.schedule.mess_id,
        managerId,
        'BAZAR_DATE_CAPACITY_UPDATED',
        'BazarDate',
        dateId,
        {
          before: date.required_members,
          after: dto.requiredMembers,
          reason: dto.reason,
        },
      );
      return updated;
    });
  }

  private async getSlotContext(slotId: string) {
    const slot = await this.prisma.bazarDutySlot.findUnique({
      where: { id: slotId },
      include: { bazar_date: { include: { schedule: true } } },
    });
    if (!slot) throw new HttpException('Bazar duty slot not found', 404);
    return slot;
  }

  private async getDateContext(dateId: string) {
    const date = await this.prisma.bazarDate.findUnique({
      where: { id: dateId },
      include: { schedule: true, slots: { orderBy: { slot_number: 'asc' } } },
    });
    if (!date) throw new HttpException('Bazar date not found', 404);
    return date;
  }

  private assertMutableSlot(
    slot: Awaited<ReturnType<BazarScheduleService['getSlotContext']>>,
  ) {
    this.assertMutableDate(slot.bazar_date);
    if (slot.status === BazarDutySlotStatus.CLOSED) {
      throw new HttpException('This bazar duty slot is closed', 409);
    }
  }

  private assertMoveSlots(
    sourceSlot: Awaited<ReturnType<BazarScheduleService['getSlotContext']>>,
    targetSlot: Awaited<ReturnType<BazarScheduleService['getSlotContext']>>,
    userId: string,
  ) {
    if (
      sourceSlot.bazar_date.schedule_id !== targetSlot.bazar_date.schedule_id
    ) {
      throw new HttpException(
        'Both duties must belong to the same monthly schedule',
        400,
      );
    }
    if (sourceSlot.bazar_date_id === targetSlot.bazar_date_id) {
      throw new HttpException(
        'Move the duty to a slot on a different bazar date',
        400,
      );
    }
    this.assertMutableSlot(sourceSlot);
    this.assertMutableSlot(targetSlot);
    this.assertDutyChangeNotice(sourceSlot);
    if (sourceSlot.assigned_member_id !== userId) {
      throw new HttpException('You can only move your own bazar duty', 403);
    }
    if (
      targetSlot.status !== BazarDutySlotStatus.AVAILABLE ||
      targetSlot.assigned_member_id
    ) {
      throw new HttpException(
        'The target bazar duty slot is not available',
        409,
      );
    }
  }

  private assertDutyChangeNotice(
    slot: Awaited<ReturnType<BazarScheduleService['getSlotContext']>>,
  ) {
    const noticeDays = slot.bazar_date.schedule.release_notice_days;
    if (daysUntil(slot.bazar_date.duty_date) < noticeDays) {
      throw new HttpException(
        `Release or move is only allowed at least ${noticeDays} days before the duty date`,
        409,
      );
    }
  }

  private assertSwapNotice(
    slot: Awaited<ReturnType<BazarScheduleService['getSlotContext']>>,
  ) {
    if (daysUntil(slot.bazar_date.duty_date) < 1) {
      throw new HttpException(
        'Bazar duties can only be swapped at least one day in advance',
        409,
      );
    }
  }

  private assertMutableDate(date: {
    duty_date: Date;
    status: BazarDateStatus;
    schedule: { status: BazarScheduleStatus };
  }) {
    if (date.schedule.status !== BazarScheduleStatus.ACTIVE)
      throw new HttpException('This bazar schedule is finished', 409);
    if (dateKey(date.duty_date) < dhakaDateKey())
      throw new HttpException('Past bazar dates are locked', 409);
    if (date.status === BazarDateStatus.COMPLETED)
      throw new HttpException('This bazar date is completed', 409);
  }

  private async assertMessAccess(messId: string, userId: string, role: string) {
    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: { id: true, name: true, created_by: true },
    });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (role === 'ADMIN' || mess.created_by === userId) return mess;
    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
      select: { is_active: true },
    });
    if (!membership?.is_active)
      throw new HttpException(
        'Forbidden: Not an active member of this mess',
        403,
      );
    return mess;
  }

  private async assertManager(messId: string, userId: string, role: string) {
    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: { id: true, name: true, created_by: true },
    });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (role === 'ADMIN' || mess.created_by === userId) return mess;
    throw new HttpException(
      'Forbidden: Only this mess manager can perform this action',
      403,
    );
  }

  private async assertEligibleMember(
    schedule: { mess_id: string; include_manager: boolean },
    userId: string,
  ) {
    const members = await this.resolveEligibleMembers(
      schedule.mess_id,
      schedule.include_manager,
    );
    if (!members.some((member) => member.id === userId)) {
      throw new HttpException(
        'This user is not eligible for bazar duty in this schedule',
        403,
      );
    }
  }

  private async resolveEligibleMembers(
    messId: string,
    includeManager: boolean,
  ) {
    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: {
        created_by: true,
        creator: { select: { ...memberSelect, is_active: true } },
        memberships: {
          where: { is_active: true, user: { is_active: true } },
          select: { user: { select: memberSelect } },
        },
      },
    });
    if (!mess) throw new HttpException('Mess not found', 404);
    const byId = new Map(
      mess.memberships.map((membership) => [
        membership.user.id,
        membership.user,
      ]),
    );
    byId.delete(mess.created_by);
    if (includeManager && mess.creator.is_active) {
      byId.set(mess.creator.id, {
        id: mess.creator.id,
        name: mess.creator.name,
        email: mess.creator.email,
        avatar_url: mess.creator.avatar_url,
      });
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  private buildOverview<
    Schedule extends {
      dates: Array<{
        duty_date: Date;
        status: BazarDateStatus;
        slots: Array<{
          status: BazarDutySlotStatus;
          assigned_member_id: string | null;
        }>;
      }>;
    },
  >(
    schedule: Schedule,
    eligibleMembers: Array<{
      id: string;
      name: string;
      email: string;
      avatar_url: string | null;
    }>,
    currentUserId?: string,
  ) {
    const today = dhakaDateKey();
    const dates = schedule.dates.map((date) => {
      const isPast = dateKey(date.duty_date) < today;
      return {
        ...date,
        isPast,
        effectiveStatus: isPast ? BazarDateStatus.COMPLETED : date.status,
        slots: date.slots.map((slot) => ({
          ...slot,
          effectiveStatus:
            isPast && slot.status === BazarDutySlotStatus.AVAILABLE
              ? BazarDutySlotStatus.CLOSED
              : slot.status,
        })),
      };
    });
    const slots = dates.flatMap((date) => date.slots);
    const distribution = eligibleMembers.map((member) => ({
      member,
      dutyCount: slots.filter(
        (slot) =>
          slot.status === BazarDutySlotStatus.ASSIGNED &&
          slot.assigned_member_id === member.id,
      ).length,
    }));
    return {
      ...schedule,
      dates,
      overview: {
        totalBazarDates: schedule.dates.length,
        totalDutySlots: slots.filter(
          (slot) => slot.status !== BazarDutySlotStatus.CLOSED,
        ).length,
        assigned: slots.filter(
          (slot) => slot.status === BazarDutySlotStatus.ASSIGNED,
        ).length,
        available: slots.filter(
          (slot) => slot.effectiveStatus === BazarDutySlotStatus.AVAILABLE,
        ).length,
        closed: slots.filter(
          (slot) => slot.status === BazarDutySlotStatus.CLOSED,
        ).length,
        expiredUnassigned: slots.filter(
          (slot) =>
            slot.status === BazarDutySlotStatus.AVAILABLE &&
            slot.effectiveStatus === BazarDutySlotStatus.CLOSED,
        ).length,
        recommendedDutyCount: recommendedDutyCount(
          slots.filter((slot) => slot.status !== BazarDutySlotStatus.CLOSED)
            .length,
          eligibleMembers.length,
        ),
        currentUserDutyCount: currentUserId
          ? slots.filter(
              (slot) =>
                slot.status === BazarDutySlotStatus.ASSIGNED &&
                slot.assigned_member_id === currentUserId,
            ).length
          : undefined,
        distribution,
      },
    };
  }

  private validatePattern(
    frequency: BazarFrequency,
    weekdays?: number[],
    customDays?: number[],
  ) {
    if (frequency === BazarFrequency.SPECIFIC_WEEKDAYS && !weekdays?.length) {
      throw new HttpException('Select at least one weekday', 400);
    }
    if (frequency === BazarFrequency.CUSTOM_DATES && !customDays?.length) {
      throw new HttpException('Select at least one custom day', 400);
    }
  }

  private uniqueSorted(values: number[]) {
    return [...new Set(values)].sort((a, b) => a - b);
  }

  private async cancelPendingForSlot(
    tx: Prisma.TransactionClient,
    slotId: string,
    actorId: string,
  ) {
    await tx.bazarSwapRequest.updateMany({
      where: {
        status: BazarRequestStatus.PENDING,
        OR: [{ requester_slot_id: slotId }, { target_slot_id: slotId }],
      },
      data: { status: BazarRequestStatus.CANCELLED, cancelled_at: new Date() },
    });
    await tx.bazarReleaseRequest.updateMany({
      where: { slot_id: slotId, status: BazarRequestStatus.PENDING },
      data: {
        status: BazarRequestStatus.CANCELLED,
        reviewer_id: actorId,
        responded_at: new Date(),
      },
    });
  }

  private audit(
    tx: Prisma.TransactionClient,
    messId: string,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    diff: Record<string, unknown>,
  ) {
    return tx.auditLog.create({
      data: {
        mess_id: messId,
        actor_id: actorId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        diff: JSON.parse(JSON.stringify(diff)) as Prisma.InputJsonValue,
      },
    });
  }

  private async notify(
    senderId: string | null,
    messId: string,
    targetUserIds: string[],
    title: string,
    body: string,
    metadata: Record<string, unknown>,
    dedupeKey?: string,
  ) {
    try {
      await this.notificationService.createForMess(
        senderId,
        messId,
        NotificationType.BAZAR_DUTY,
        title,
        body,
        metadata,
        [...new Set(targetUserIds)],
        '/dashboard/bazar-schedule',
        dedupeKey,
      );
    } catch {
      // Notification delivery must not roll back an already committed duty change.
    }
  }

  private rethrowConcurrency(error: unknown, message: string): never {
    if (error instanceof HttpException) throw error;
    const code = (error as { code?: string }).code;
    if (code === 'P2002' || code === 'P2034')
      throw new HttpException(message, 409);
    throw error;
  }
}
