import { HttpException, Injectable } from '@nestjs/common';
import {
  CompleteMessSetupDto,
  CreateMessDto,
  MessFilterDto,
  RequestMemberJoinDto,
  RequestMessRegistrationDto,
  ReviewMemberJoinRequestDto,
  ReviewMessRequestDto,
  UpdateMemberDto,
  UpdateMessDto,
} from './dto/mess.dto';
import { MembershipRole, NotificationType, Prisma, RequestStatus } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonthlyBillService } from '../monthly-bill/monthly-bill.service';
import { NotificationService } from '../notification/notification.service';
import { SubscriptionService } from '../subscription/subscription.service';

type MessMembershipReader = Pick<PrismaService, 'messMembership'> | Prisma.TransactionClient;

@Injectable()
export class MessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlyBillService: MonthlyBillService,
    private readonly notificationService: NotificationService,
    private readonly subscriptionService: SubscriptionService,
  ) { }

  private async recalculateCurrentMonthBillIfPossible(messId: string) {
    const activeMembers = await this.prisma.messMembership.count({
      where: {
        mess_id: messId,
        is_active: true,
      },
    });

    if (!activeMembers) return;

    await this.monthlyBillService.recalculateMonthlyBills(messId, new Date());
  }

  private async ensureUserHasNoActiveMess(
    userId: string,
    options: {
      client?: MessMembershipReader;
      subject?: string;
    } = {},
  ) {
    const client = options.client ?? this.prisma;
    const subject = options.subject ?? 'You are';
    const activeMembership = await client.messMembership.findFirst({
      where: {
        user_id: userId,
        is_active: true,
      },
      include: {
        mess: {
          select: { id: true, name: true },
        },
      },
    });

    if (activeMembership) {
      throw new HttpException(
        `${subject} already active in ${activeMembership.mess?.name ?? 'another mess'}`,
        400,
      );
    }
  }

  private readonly messSelect = {
    id: true,
    name: true,
    description: true,
    address: true,
    mess_category: true,
    rooms: true,
    meal_rate: true,
    currency: true,
    total_seats: true,
    monthly_rent: true,
    electricity_bill: true,
    gas_bill: true,
    wifi_bill: true,
    cleaner_bill: true,
    extra_cost: true,
    meal_types: true,
    meal_rate_method: true,
    bazar_rules: true,
    payment_deadline_day: true,
    meal_off_deadline: true,
    settings_completed: true,
    created_by: true,
    is_active: true,
    approved_at: true,
    created_at: true,
    creator: { select: { id: true, name: true, email: true } },
    _count: { select: { memberships: true, deposits: true, meals: true } },
  } as const;

  private readonly activeMessForJoinSelect = {
    ...this.messSelect,
    memberships: {
      where: { is_active: true },
      select: { room_no: true, is_active: true },
    },
  } as const satisfies Prisma.MessSelect;

  private readonly memberJoinRequestInclude = {
    requester: { select: { id: true, name: true, email: true, phone: true, role: true } },
    reviewer: { select: { id: true, name: true, email: true } },
    mess: { select: { id: true, name: true, address: true, is_active: true, created_by: true } },
  } as const;

  private decorateRoomsWithAvailability<
    T extends {
      rooms?: Prisma.JsonValue | null;
      memberships?: Array<{ room_no?: string | null; is_active?: boolean }> | null;
    },
  >(mess: T) {
    const occupancy = new Map<string, number>();

    for (const membership of mess.memberships ?? []) {
      if (!membership?.is_active || !membership.room_no) continue;
      occupancy.set(membership.room_no, (occupancy.get(membership.room_no) ?? 0) + 1);
    }

    const rooms = Array.isArray(mess.rooms)
      ? mess.rooms.map((room) => {
          if (!room || typeof room !== 'object' || Array.isArray(room)) return room;

          const roomData = room as Record<string, unknown>;
          const roomName = typeof roomData['roomName'] === 'string' ? roomData['roomName'] : '';
          const totalSeats = Number(roomData['perPerson'] ?? 0);
          const occupiedSeats = roomName ? occupancy.get(roomName) ?? 0 : 0;
          const availableSeats = totalSeats > 0 ? Math.max(totalSeats - occupiedSeats, 0) : null;

          return {
            ...roomData,
            occupiedSeats,
            availableSeats,
            isFull: availableSeats !== null ? availableSeats <= 0 : false,
          };
        })
      : mess.rooms;

    return {
      ...mess,
      rooms,
    };
  }

  private getCollectionMessage(
    total: number,
    messages: { empty: string; found: string },
  ) {
    return total > 0 ? messages.found : messages.empty;
  }

  private async verifyManagerAccess(messId: string, userId: string, role: string) {
    if (role === 'ADMIN') return;
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;
    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (membership?.is_active && membership.role === MembershipRole.MANAGER) return;
    throw new HttpException('Forbidden: Only mess managers can perform this action', 403);
  }

  async requestRegistration(userId: string, dto: RequestMessRegistrationDto) {
    console.log('Checking for existing pending requests for user:', userId);
    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    const pending = await this.prisma.messRequest.findFirst({
      where: { requester_id: userId, status: RequestStatus.PENDING },
    });
    if (pending) throw new HttpException('You already have a pending mess registration request', 400);
    await this.ensureUserHasNoActiveMess(userId);

    const request = await this.prisma.messRequest.create({
      data: {
        requester_id: userId,
        mess_name: dto.messName,
        address: dto.address,
        mess_category: dto.messCategory,
        rooms: dto.rooms as Prisma.InputJsonValue | undefined,
        total_seats: dto.totalSeats,
        monthly_rent: dto.monthlyRent,
        description: dto.description,
      },
      include: { requester: { select: { id: true, name: true, email: true, phone: true } } },
    });

    const adminUserIds = await this.notificationService.resolveAdminUserIds();
    await this.notificationService.sendPushToUsers(adminUserIds, {
      title: 'New mess registration request',
      body: `${requester?.name ?? 'A user'} requested approval for ${request.mess_name}.`,
      url: '/dashboard/notifications',
      data: {
        source: 'MESS_REQUEST',
        requestId: request.id,
      },
    });

    return request;
  }

  async findRequests(query: MessFilterDto & { status?: RequestStatus }) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(paginationOptions);
    const where: Prisma.MessRequestWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.searchTerm) {
      where.OR = [
        { mess_name: { contains: query.searchTerm, mode: 'insensitive' } },
        { address: { contains: query.searchTerm, mode: 'insensitive' } },
        { requester: { email: { contains: query.searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [total, requests] = await Promise.all([
      this.prisma.messRequest.count({ where }),
      this.prisma.messRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          requester: { select: { id: true, name: true, email: true, phone: true } },
          reviewer: { select: { id: true, name: true, email: true } },
          mess: { select: { id: true, name: true, is_active: true } },
        },
      }),
    ]);

    return { data: requests, meta: buildMeta(total, page, limit) };
  }

  async findMyRequests(userId: string, query: MessFilterDto) {
    const result = await this.findRequests(query);
    return {
      ...result,
      data: result.data.filter((request) => request.requester_id === userId),
    };
  }

  async deleteRequest(requestId: string) {
    const request = await this.prisma.messRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new HttpException('Mess registration request not found', 404);

    await this.prisma.messRequest.delete({ where: { id: requestId } });
    return { message: 'Mess registration request deleted successfully' };
  }

  async reviewRequest(requestId: string, adminId: string, dto: ReviewMessRequestDto) {
    const request = await this.prisma.messRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new HttpException('Mess registration request not found', 404);
    if (request.status !== RequestStatus.PENDING) {
      throw new HttpException('This request has already been reviewed', 400);
    }

    if (dto.status === RequestStatus.REJECTED) {
      return this.prisma.messRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.REJECTED,
          review_note: dto.reviewNote,
          reviewed_by: adminId,
          reviewed_at: new Date(),
        },
        include: { requester: { select: { id: true, name: true, email: true } } },
      });
    }

    const trialPlan = await this.subscriptionService.getPlanInfo('TRIAL');
    const trialDays = trialPlan?.days ?? 30;

    const result = await this.prisma.$transaction(
      async (tx) => {
        await this.ensureUserHasNoActiveMess(request.requester_id, {
          client: tx,
          subject: 'This user is',
        });

        const mess = await tx.mess.create({
          data: {
            name: request.mess_name,
            address: request.address,
            description: request.description,
            mess_category: request.mess_category,
            rooms: (request.rooms ?? undefined) as Prisma.InputJsonValue | undefined,
            total_seats: request.total_seats,
            monthly_rent: request.monthly_rent,
            created_by: request.requester_id,
            meal_rate: 0,
            currency: 'BDT',
            approved_at: new Date(),
            memberships: {
              create: {
                user_id: request.requester_id,
                role: MembershipRole.MANAGER,
                created_by: adminId,
                monthly_rent: request.monthly_rent,
              },
            },
          },
        });

        await tx.user.update({
          where: { id: request.requester_id },
          data: { role: 'MANAGER' },
        });

        const existingSubscription = await tx.subscription.findUnique({
          where: { mess_id: mess.id },
        });
        if (!existingSubscription) {
          await tx.subscription.create({
            data: {
              mess_id: mess.id,
              plan: 'TRIAL',
              status: 'ACTIVE',
              start_date: new Date(),
              end_date: (() => {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + trialDays);
                return endDate;
              })(),
            },
          });
        }

        return tx.messRequest.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.APPROVED,
            mess_id: mess.id,
            review_note: dto.reviewNote,
            reviewed_by: adminId,
            reviewed_at: new Date(),
          },
          include: {
            requester: { select: { id: true, name: true, email: true, role: true } },
            reviewer: { select: { id: true, name: true, email: true } },
            mess: { select: this.messSelect },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    void this.notificationService.sendPushToUsers([request.requester_id], {
      title: 'Your mess is approved',
      body: 'A 30-day free trial has started. You can upgrade anytime from the dashboard.',
      url: '/dashboard',
      data: {
        source: 'MESS_APPROVAL',
        requestId,
      },
    }).catch(() => undefined);

    return result;
  }

  // ─────────────────────────────────────────
  // Create mess (Manager creates own mess)
  // ─────────────────────────────────────────
  async create(managerId: string, dto: CreateMessDto) {
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!manager) throw new HttpException('User not found', 404);
    await this.ensureUserHasNoActiveMess(managerId);

    const trialPlan = await this.subscriptionService.getPlanInfo('TRIAL');
    const trialDays = trialPlan?.days ?? 30;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + trialDays);

    const mess = await this.prisma.$transaction(
      async (tx) => {
        await this.ensureUserHasNoActiveMess(managerId, { client: tx });

        const createdMess = await tx.mess.create({
          data: {
            name: dto.messName,
            address: dto.messLocation,
            description: dto.description,
            mess_category: dto.messCategory,
            rooms: dto.rooms as Prisma.InputJsonValue | undefined,
            total_seats: dto.totalSeats,
            monthly_rent: dto.monthlyRent,
            created_by: managerId,
            meal_rate: dto.meal_rate ?? '0',
            currency: dto.currency ?? 'BDT',
            approved_at: new Date(),
            memberships: {
              create: {
                user_id: managerId,
                role: MembershipRole.MANAGER,
                created_by: managerId,
                monthly_rent: dto.monthlyRent,
              },
            },
            subscription: {
              create: {
                plan: 'TRIAL',
                status: 'ACTIVE',
                start_date: startDate,
                end_date: endDate,
              },
            },
          },
          select: this.messSelect,
        });

        await tx.user.update({
          where: { id: managerId },
          data: { role: 'MANAGER' },
        });

        return createdMess;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const adminUserIds = await this.notificationService.resolveAdminUserIds();
    if (adminUserIds.length > 0) {
      void this.notificationService.createForMess(
        managerId,
        mess.id,
        NotificationType.ANNOUNCEMENT,
        'New mess created',
        `${manager.name} created ${mess.name}.`,
        {
          source: 'MESS_CREATED',
          messId: mess.id,
          createdBy: managerId,
        },
        adminUserIds,
        '/dashboard/mess_management',
        `mess-created-${mess.id}`,
      ).catch(() => undefined);
    }

    return mess;
  }

  async findActiveMessesForJoin(query: MessFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(paginationOptions);

    const where: Prisma.MessWhereInput = { is_active: true };
    if (query.searchTerm) {
      where.OR = [
        { name: { contains: query.searchTerm, mode: 'insensitive' } },
        { address: { contains: query.searchTerm, mode: 'insensitive' } },
      ];
    }

    const [total, messes] = await Promise.all([
      this.prisma.mess.count({ where }),
      this.prisma.mess.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: this.activeMessForJoinSelect,
      }),
    ]);

    const data = messes.map((mess) => {
      const decorated = this.decorateRoomsWithAvailability(mess);
      const { memberships, ...rest } = decorated;
      return rest;
    });

    return {
      message: this.getCollectionMessage(total, {
        found: 'Active messes fetched successfully',
        empty: 'No active messes are available right now',
      }),
      data,
      meta: buildMeta(total, page, limit),
    };
  }

  async requestMemberJoin(userId: string, dto: RequestMemberJoinDto) {
    const [requester, mess, pendingRequest] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      this.prisma.mess.findFirst({
        where: { id: dto.messId, is_active: true },
        select: { id: true, name: true, created_by: true },
      }),
      this.prisma.memberJoinRequest.findFirst({
        where: {
          requester_id: userId,
          mess_id: dto.messId,
          status: RequestStatus.PENDING,
        },
      }),
    ]);

    if (!requester) throw new HttpException('User not found', 404);
    if (!mess) throw new HttpException('Mess not found', 404);
    await this.ensureUserHasNoActiveMess(userId);
    if (pendingRequest) {
      throw new HttpException('You already have a pending request for this mess', 400);
    }

    const request = await this.prisma.memberJoinRequest.create({
      data: {
        requester_id: userId,
        mess_id: dto.messId,
      },
      include: this.memberJoinRequestInclude,
    });

    const managerUserIds = await this.resolveMessManagerUserIds(dto.messId);
    if (managerUserIds.length > 0) {
      void this.notificationService.createForMess(
        userId,
        dto.messId,
        NotificationType.ANNOUNCEMENT,
        'New member request',
        `${requester.name} requested to join ${mess.name}.`,
        {
          source: 'MEMBER_JOIN_REQUEST',
          requestId: request.id,
          messId: dto.messId,
        },
        managerUserIds,
        '/dashboard/member_management',
        `member-join-request-${request.id}`,
      ).catch(() => undefined);
    }

    return request;
  }

  async findMyMemberJoinRequests(userId: string, query: MessFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(paginationOptions);
    const where: Prisma.MemberJoinRequestWhereInput = { requester_id: userId };

    const [total, requests] = await Promise.all([
      this.prisma.memberJoinRequest.count({ where }),
      this.prisma.memberJoinRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.memberJoinRequestInclude,
      }),
    ]);

    return { data: requests, meta: buildMeta(total, page, limit) };
  }

  async findManagedMemberJoinRequests(managerId: string, query: MessFilterDto & { status?: RequestStatus }) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(paginationOptions);
    const where: Prisma.MemberJoinRequestWhereInput = {
      mess: {
        is_active: true,
        OR: [
          { created_by: managerId },
          {
            memberships: {
              some: {
                user_id: managerId,
                role: MembershipRole.MANAGER,
                is_active: true,
              },
            },
          },
        ],
      },
    };

    if (query.status) where.status = query.status;
    if (query.searchTerm) {
      where.OR = [
        { requester: { name: { contains: query.searchTerm, mode: 'insensitive' } } },
        { requester: { email: { contains: query.searchTerm, mode: 'insensitive' } } },
        { mess: { name: { contains: query.searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [total, requests] = await Promise.all([
      this.prisma.memberJoinRequest.count({ where }),
      this.prisma.memberJoinRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: this.memberJoinRequestInclude,
      }),
    ]);

    return { data: requests, meta: buildMeta(total, page, limit) };
  }

  async reviewMemberJoinRequest(requestId: string, managerId: string, dto: ReviewMemberJoinRequestDto) {
    const request = await this.prisma.memberJoinRequest.findUnique({
      where: { id: requestId },
      include: this.memberJoinRequestInclude,
    });

    if (!request) throw new HttpException('Member join request not found', 404);
    if (request.status !== RequestStatus.PENDING) {
      throw new HttpException('This request has already been reviewed', 400);
    }

    await this.verifyManagerAccess(request.mess_id, managerId, 'MANAGER');

    if (dto.status === RequestStatus.REJECTED) {
      const rejected = await this.prisma.memberJoinRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.REJECTED,
          review_note: dto.reviewNote,
          reviewed_by: managerId,
          reviewed_at: new Date(),
        },
        include: this.memberJoinRequestInclude,
      });

      void this.notifyMemberJoinReview(rejected.id, rejected.mess_id, rejected.requester_id, managerId, false)
        .catch(() => undefined);
      return rejected;
    }

    const approved = await this.prisma.$transaction(
      async (tx) => {
        await this.ensureUserHasNoActiveMess(request.requester_id, {
          client: tx,
          subject: `${request.requester.name} is`,
        });

        const existingMembership = await tx.messMembership.findUnique({
          where: {
            mess_id_user_id: {
              mess_id: request.mess_id,
              user_id: request.requester_id,
            },
          },
        });

        if (existingMembership) {
          await tx.messMembership.update({
            where: {
              mess_id_user_id: {
                mess_id: request.mess_id,
                user_id: request.requester_id,
              },
            },
            data: {
              role: MembershipRole.MEMBER,
              is_active: true,
              joined_at: new Date(),
              left_at: null,
              created_by: managerId,
            },
          });
        } else {
          await tx.messMembership.create({
            data: {
              mess_id: request.mess_id,
              user_id: request.requester_id,
              role: MembershipRole.MEMBER,
              created_by: managerId,
            },
          });
        }

        const activeManagerMemberships = await tx.messMembership.count({
          where: {
            user_id: request.requester_id,
            role: MembershipRole.MANAGER,
            is_active: true,
          },
        });
        if (activeManagerMemberships === 0) {
          await tx.user.update({
            where: { id: request.requester_id },
            data: { role: 'MEMBER' },
          });
        }

        return tx.memberJoinRequest.update({
          where: { id: requestId },
          data: {
            status: RequestStatus.APPROVED,
            review_note: dto.reviewNote,
            reviewed_by: managerId,
            reviewed_at: new Date(),
          },
          include: this.memberJoinRequestInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.recalculateCurrentMonthBillIfPossible(request.mess_id);
    void this.notifyMemberJoinReview(approved.id, approved.mess_id, approved.requester_id, managerId, true)
      .catch(() => undefined);

    return approved;
  }

  private async resolveMessManagerUserIds(messId: string) {
    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: {
        created_by: true,
        memberships: {
          where: {
            role: MembershipRole.MANAGER,
            is_active: true,
          },
          select: { user_id: true },
        },
      },
    });

    return [
      ...new Set([
        ...(mess?.created_by ? [mess.created_by] : []),
        ...(mess?.memberships.map((membership) => membership.user_id) ?? []),
      ]),
    ];
  }

  private async notifyMemberJoinReview(
    requestId: string,
    messId: string,
    requesterId: string,
    managerId: string,
    accepted: boolean,
  ) {
    await this.notificationService.createForMess(
      managerId,
      messId,
      NotificationType.ANNOUNCEMENT,
      accepted ? 'Member request approved' : 'Member request rejected',
      accepted
        ? 'Your request to join the mess has been approved.'
        : 'Your request to join the mess was rejected.',
      {
        source: accepted ? 'MEMBER_JOIN_APPROVED' : 'MEMBER_JOIN_REJECTED',
        requestId,
        messId,
      },
      [requesterId],
      '/dashboard',
      `member-join-review-${requestId}-${accepted ? 'approved' : 'rejected'}`,
    );
  }

  // ─────────────────────────────────────────
  // Get all messes (Admin)
  // ─────────────────────────────────────────
  async findAll(query: MessFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);

    const where: Prisma.MessWhereInput = {};

    if (query.searchTerm) {
      where.OR = [
        { name: { contains: query.searchTerm, mode: 'insensitive' } },
        { address: { contains: query.searchTerm, mode: 'insensitive' } },
        {
          creator: {
            email: { contains: query.searchTerm, mode: 'insensitive' },
          },
        },
      ];
    }

    const [total, messes] = await Promise.all([
      this.prisma.mess.count({ where }),
      this.prisma.mess.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: this.messSelect,
      }),
    ]);

    return {
      data: messes,
      meta: buildMeta(total, page, limit),
    };
  }

  // ─────────────────────────────────────────
  // Get messes the current user owns or belongs to
  // ─────────────────────────────────────────
  async findMyMess(userId: string) {
    const mess = await this.prisma.mess.findMany({
      where: {
        is_active: true,
        OR: [
          { created_by: userId },
          { memberships: { some: { user_id: userId, is_active: true } } },
        ],
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        memberships: {
          where: { is_active: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
                phone: true,
              },
            },
          },
        },
        _count: { select: { memberships: true, deposits: true, meals: true } },
      },
    });

    if (!mess || mess.length === 0) return [];
    return mess.map((item) => this.decorateRoomsWithAvailability(item));
  }

  // ─────────────────────────────────────────
  // Get single mess by ID
  // ─────────────────────────────────────────
  async findOne(id: string) {
    const mess = await this.prisma.mess.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        memberships: {
          where: { is_active: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
                phone: true,
              },
            },
          },
        },
        _count: { select: { memberships: true } },
      },
    });

    if (!mess) throw new HttpException('Mess not found', 404);
    return this.decorateRoomsWithAvailability(mess);
  }

  // ─────────────────────────────────────────
  // Update mess (Manager: own mess | Admin: any)
  // ─────────────────────────────────────────
  async update(
    messId: string,
    requesterId: string,
    requesterRole: string,
    dto: UpdateMessDto,
  ) {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    if (
      (requesterRole === 'MANAGER' || requesterRole === 'manager') &&
      mess.created_by !== requesterId
    ) {
      throw new HttpException('Forbidden: Not your mess', 403);
    }

    const updated = await this.prisma.mess.update({
      where: { id: messId },
      data: {
        name: dto.messName,
        address: dto.messLocation,
        description: dto.description,
      },
      select: this.messSelect,
    });

    return updated;
  }

  // ─────────────────────────────────────────
  // Delete mess
  // ─────────────────────────────────────────
  async remove(messId: string, requesterId: string, requesterRole: string) {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    if (requesterRole === 'ADMIN') {
      // Admin can delete any mess
    } else if (
      (requesterRole === 'MANAGER') &&
      mess.created_by !== requesterId
    ) {
      throw new HttpException('Forbidden: Not your mess', 403);
    } else if (
      requesterRole !== 'MANAGER' &&
      requesterRole !== 'ADMIN'
    ) {
      throw new HttpException('Forbidden', 403);
    }

    await this.prisma.$transaction(async (tx) => {
      // ── Explicitly delete ALL data belonging to this mess ──
      // (Most tables have ON DELETE CASCADE at DB level, but we delete
      //  explicitly here for safety, clarity, and to ensure no orphan data.)

      // 1. Meal attendances (through meals)
      await tx.mealAttendance.deleteMany({ where: { meal: { mess_id: messId } } });
      // 2. Meals
      await tx.meal.deleteMany({ where: { mess_id: messId } });
      // 3. Monthly bills (and their linked payments will be handled below)
      await tx.monthlyBill.deleteMany({ where: { mess_id: messId } });
      // 4. Payments
      await tx.payment.deleteMany({ where: { mess_id: messId } });
      // 5. Deposits
      await tx.deposit.deleteMany({ where: { mess_id: messId } });
      // 6. Expenses
      await tx.expense.deleteMany({ where: { mess_id: messId } });
      // 7. Shopping items (through shopping lists)
      await tx.shoppingItem.deleteMany({ where: { list: { mess_id: messId } } });
      // 8. Shopping lists
      await tx.shoppingList.deleteMany({ where: { mess_id: messId } });
      // 9. Notification reads (through notifications)
      await tx.notificationRead.deleteMany({ where: { notification: { mess_id: messId } } });
      // 10. Notifications
      await tx.notification.deleteMany({ where: { mess_id: messId } });
      // 11. Complaints
      await tx.complaint.deleteMany({ where: { mess_id: messId } });
      // 12. Notices
      await tx.notice.deleteMany({ where: { mess_id: messId } });
      // 13. Audit logs
      await tx.auditLog.deleteMany({ where: { mess_id: messId } });
      // 14. Subscription
      await tx.subscription.deleteMany({ where: { mess_id: messId } });
      // 15. Mess memberships (user accounts are NOT deleted)
      await tx.messMembership.deleteMany({ where: { mess_id: messId } });
      // 16. Mess requests that reference this mess
      await tx.messRequest.deleteMany({ where: { mess_id: messId } });
      // 17. Finally delete the mess itself
      await tx.mess.delete({ where: { id: messId } });
    });

    return { message: 'Mess deleted successfully' };
  }

  // ─────────────────────────────────────────
  // Add member to mess (manager)
  // ─────────────────────────────────────────
  // ─────────────────────────────────────────
  // Complete mess setup / Update mess billing settings
  // ─────────────────────────────────────────
  // async completeSetup(
  //   messId: string,
  //   userId: string,
  //   role: string,
  //   dto: CompleteMessSetupDto,
  // ) {
  //   await this.verifyManagerAccess(messId, userId, role);

  //   const updatedMess = await this.prisma.mess.update({
  //     where: {
  //       id: messId,
  //     },
  //     data: {
  //       name: dto.messName,
  //       address: dto.address,
  //       total_seats: dto.totalSeats,
  //       monthly_rent: dto.monthlyRent,
  //       electricity_bill: dto.electricityBill,
  //       gas_bill: dto.gasBill,
  //       wifi_bill: dto.wifiBill,
  //       cleaner_bill: dto.cleanerBill,
  //       extra_cost: dto.extraCost,
  //       meal_types: dto.mealTypes ?? undefined,
  //       meal_rate_method: dto.mealRateMethod,
  //       bazar_rules: dto.bazarRules,
  //       payment_deadline_day: dto.paymentDeadlineDay,
  //       meal_off_deadline: dto.mealOffDeadline,
  //       settings_completed: true,
  //     },
  //     select: this.messSelect,
  //   });

  //   await this.recalculateCurrentMonthBillIfPossible(messId);

  //   return updatedMess;
  // }

  async completeSetup(
    messId: string,
    userId: string,
    role: string,
    dto: CompleteMessSetupDto,
  ) {
    await this.verifyManagerAccess(messId, userId, role);

    const updatedMess = await this.prisma.$transaction(async (tx) => {
      const mess = await tx.mess.update({
        where: { id: messId },
        data: {
          name: dto.messName,
          address: dto.address,
          mess_category: dto.messCategory,
          rooms: dto.rooms as Prisma.InputJsonValue | undefined,
          total_seats: dto.totalSeats,
          monthly_rent: dto.monthlyRent,
          electricity_bill: dto.electricityBill,
          gas_bill: dto.gasBill,
          wifi_bill: dto.wifiBill,
          cleaner_bill: dto.cleanerBill,
          extra_cost: dto.extraCost,
          meal_types: dto.mealTypes ?? undefined,
          meal_rate_method: dto.mealRateMethod,
          bazar_rules: dto.bazarRules,
          payment_deadline_day: dto.paymentDeadlineDay,
          meal_off_deadline: dto.mealOffDeadline,
          settings_completed: true,
        },
        select: this.messSelect,
      });

      await tx.messMembership.updateMany({
        where: {
          mess_id: messId,
          is_active: true,
        },
        data: {
          monthly_rent: dto.monthlyRent,
        },
      });

      return mess;
    });

    await this.monthlyBillService.recalculateMonthlyBills(messId, new Date());

    return updatedMess;
  }

  private async checkRoomAvailability(messId: string, roomNo: string, rooms: Prisma.JsonValue[]): Promise<void> {
    const roomConfig = rooms.find((r) => {
      if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
      const obj = r as Record<string, unknown>;
      return obj['roomName'] === roomNo;
    });
    if (!roomConfig) return;

    const obj = roomConfig as Record<string, unknown>;
    const maxPerson = Number(obj['perPerson'] ?? Infinity);
    if (!maxPerson || maxPerson < 1) return;

    const currentOccupants = await this.prisma.messMembership.count({
      where: {
        mess_id: messId,
        room_no: roomNo,
        is_active: true,
      },
    });

    if (currentOccupants >= maxPerson) {
      throw new HttpException(
        `Room ${roomNo} is full (${currentOccupants}/${maxPerson} occupied). No seats available.`,
        400,
      );
    }
  }

  private async autoCalculateMonthlyRent(messId: string, roomNo: string | undefined | null, rooms: Prisma.JsonValue[]): Promise<number | undefined> {
    if (!roomNo) return undefined;

    const roomConfig = rooms.find((r) => {
      if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
      const obj = r as Record<string, unknown>;
      return obj['roomName'] === roomNo;
    });
    if (!roomConfig) return undefined;

    const obj = roomConfig as Record<string, unknown>;
    const roomPrice = Number(obj['roomPrice'] ?? 0);
    const totalPerson = Number(obj['perPerson'] ?? 1);

    if (roomPrice <= 0 || totalPerson <= 0) return undefined;

    return Math.round(roomPrice / totalPerson);
  }

  async addMember(messId: string, managerId: string, email: string, role: MembershipRole, dto?: Partial<UpdateMemberDto>) {
    await this.verifyManagerAccess(messId, managerId, 'MANAGER');

    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: { id: true, rooms: true },
    });
    if (!mess) throw new HttpException('Mess not found', 404);

    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) throw new HttpException('User not found', 404);

    await this.ensureUserHasNoActiveMess(user.id, { subject: 'User is' });

    const existing = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: user.id } },
    });
    if (existing) throw new HttpException('User is already a member', 400);

    const rooms = Array.isArray(mess.rooms) ? mess.rooms : [];

    if (dto?.roomNo) {
      const hasMatchingRoom = rooms.some((room) => {
        if (!room || typeof room !== 'object' || Array.isArray(room)) return false;
        return (room as Record<string, unknown>)['roomName'] === dto.roomNo;
      });

      if (!hasMatchingRoom) {
        throw new HttpException('Selected room does not belong to this mess', 400);
      }

      // Check room availability
      await this.checkRoomAvailability(messId, dto.roomNo, rooms);
    }

    // Auto-calculate monthly rent from room config
    const autoRent = await this.autoCalculateMonthlyRent(messId, dto?.roomNo, rooms);

    // ─── Single Manager Rule: Demote current manager if adding a new MANAGER ───
    if (role === MembershipRole.MANAGER) {
      await this.prisma.$transaction(async (tx) => {
        const currentManager = await tx.messMembership.findFirst({
          where: {
            mess_id: messId,
            role: MembershipRole.MANAGER,
            is_active: true,
            user_id: { not: user.id },
          },
        });

        if (currentManager) {
          await tx.messMembership.update({
            where: { mess_id_user_id: { mess_id: messId, user_id: currentManager.user_id } },
            data: { role: MembershipRole.MEMBER },
          });

          // Update demoted user's global role if they have no other active MANAGER memberships
          const otherManagerCount = await tx.messMembership.count({
            where: {
              user_id: currentManager.user_id,
              role: MembershipRole.MANAGER,
              is_active: true,
              mess_id: { not: messId },
            },
          });
          if (otherManagerCount === 0) {
            await tx.user.update({
              where: { id: currentManager.user_id },
              data: { role: 'MEMBER' },
            });
          }
        }

        // Transfer mess ownership to the new manager
        await tx.mess.update({
          where: { id: messId },
          data: { created_by: user.id },
        });

        // Update new manager's global role
        await tx.user.update({
          where: { id: user.id },
          data: { role: 'MANAGER' },
        });
      });
    }

    const member = await this.prisma.messMembership.create({
      data: {
        mess_id: messId,
        user_id: user.id,
        role: role,
        created_by: managerId,
        room_no: dto?.roomNo,
        seat_no: dto?.seatNo,
        monthly_rent: autoRent ?? dto?.monthlyRent,
        deposit_amount: dto?.depositAmount,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return member;
  }

  // ─────────────────────────────────────────
  // Remove member from mess (Manager)
  // ─────────────────────────────────────────
  async removeMember(messId: string, userId: string, managerId: string) {
    await this.verifyManagerAccess(messId, managerId, 'MANAGER');

    const member = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!member)
      throw new HttpException('User is not a member of this mess', 404);

    await this.prisma.messMembership.update({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
      data: { is_active: false, left_at: new Date() },
    });

    // Recalculate monthly bills so removed member's data is no longer included
    await this.recalculateCurrentMonthBillIfPossible(messId);

    return { message: 'Member removed successfully' };
  }

  async updateMember(messId: string, userId: string, managerId: string, managerRole: string, dto: UpdateMemberDto) {
    await this.verifyManagerAccess(messId, managerId, managerRole);

    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: { id: true, rooms: true },
    });
    if (!mess) throw new HttpException('Mess not found', 404);

    const member = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!member) throw new HttpException('User is not a member of this mess', 404);

    const rooms = Array.isArray(mess.rooms) ? mess.rooms : [];

    // Handle room change with availability check and swap logic
    if (dto.roomNo && dto.roomNo !== member.room_no) {
      // Check if target room exists in mess
      const hasMatchingRoom = rooms.some((room) => {
        if (!room || typeof room !== 'object' || Array.isArray(room)) return false;
        const obj = room as Record<string, unknown>;
        return obj['roomName'] === dto.roomNo;
      });
      if (!hasMatchingRoom) {
        throw new HttpException('Selected room does not belong to this mess', 400);
      }

      // Check if the target room has capacity
      const roomConfig = rooms.find((r) => {
        if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
        return (r as Record<string, unknown>)['roomName'] === dto.roomNo;
      });
      const maxPerson = Number((roomConfig as Record<string, unknown>)?.['perPerson'] ?? Infinity);

      if (maxPerson >= 1) {
        const currentOccupants = await this.prisma.messMembership.count({
          where: {
            mess_id: messId,
            room_no: dto.roomNo,
            is_active: true,
            user_id: { not: userId }, // exclude current member
          },
        });

        if (currentOccupants >= maxPerson) {
          // Swap logic: if there's exactly 1 occupant & maxPerson is 1, we need to kick them out
          // For simplicity, if room is full, throw error with suggestion
          throw new HttpException(
            `Room "${dto.roomNo}" is full (${currentOccupants}/${maxPerson} occupied). Cannot move member.`,
            400,
          );
        }
      }
    }

    // Auto-calculate monthly rent if room is being set/changed
    let monthlyRent = dto.monthlyRent;
    if (dto.roomNo && dto.roomNo !== member.room_no) {
      const autoRent = await this.autoCalculateMonthlyRent(messId, dto.roomNo, rooms);
      if (autoRent !== undefined) {
        monthlyRent = autoRent;
      }
    }

    // ─── Single Manager Rule: Demote current manager if promoting a member to MANAGER ───
    if (dto.role === MembershipRole.MANAGER && member.role !== MembershipRole.MANAGER) {
      await this.prisma.$transaction(async (tx) => {
        const currentManager = await tx.messMembership.findFirst({
          where: {
            mess_id: messId,
            role: MembershipRole.MANAGER,
            is_active: true,
            user_id: { not: userId },
          },
        });

        if (currentManager) {
          await tx.messMembership.update({
            where: { mess_id_user_id: { mess_id: messId, user_id: currentManager.user_id } },
            data: { role: MembershipRole.MEMBER },
          });

          // Update demoted user's global role if they have no other active MANAGER memberships
          const otherManagerCount = await tx.messMembership.count({
            where: {
              user_id: currentManager.user_id,
              role: MembershipRole.MANAGER,
              is_active: true,
              mess_id: { not: messId },
            },
          });
          if (otherManagerCount === 0) {
            await tx.user.update({
              where: { id: currentManager.user_id },
              data: { role: 'MEMBER' },
            });
          }
        }

        // Transfer mess ownership to the new manager so getAllMembers works correctly
        await tx.mess.update({
          where: { id: messId },
          data: { created_by: userId },
        });

        // Update the target user's global role when promoting to MANAGER
        await tx.user.update({
          where: { id: userId },
          data: { role: 'MANAGER' },
        });
      });

    // Update the target user's global role when demoting from MANAGER
    } else if (dto.role === MembershipRole.MEMBER && member.role === MembershipRole.MANAGER) {
      const remainingManagerCount = await this.prisma.messMembership.count({
        where: {
          user_id: userId,
          role: MembershipRole.MANAGER,
          is_active: true,
          mess_id: { not: messId },
        },
      });
      if (remainingManagerCount === 0) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { role: 'MEMBER' },
        });
      }
    }

    return this.prisma.messMembership.update({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
      data: {
        role: dto.role,
        is_active: dto.isActive,
        left_at: dto.isActive === false ? new Date() : dto.isActive === true ? null : undefined,
        room_no: dto.roomNo,
        seat_no: dto.seatNo,
        monthly_rent: monthlyRent,
        deposit_amount: dto.depositAmount,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar_url: true, phone: true, role: true } },
        mess: { select: { id: true, name: true } },
      },
    });
  }

  async assignManager(messId: string, userId: string, role: MembershipRole, managerId: string) {

    // Make sure the manager owns this mess
    const manager = await this.prisma.user.findUnique({ where: { id: managerId } })

    if (!manager) throw new HttpException('Forbidden', 403)

    const mess = await this.prisma.mess.findUnique({ where: { id: messId } })
    if (!mess || mess.created_by !== managerId) throw new HttpException('Forbidden: Not your mess', 403)
    // Update MessMembership role
    const memberShip = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } }
    })

    if (!memberShip) throw new HttpException('User is not a member of this mess', 404)

    // ─── Single Manager Rule: Demote current manager if promoting to MANAGER ───
    if (role === MembershipRole.MANAGER && memberShip.role !== MembershipRole.MANAGER) {
      const currentManager = await this.prisma.messMembership.findFirst({
        where: {
          mess_id: messId,
          role: MembershipRole.MANAGER,
          is_active: true,
          user_id: { not: userId },
        },
      });

      if (currentManager) {
        await this.prisma.messMembership.update({
          where: { mess_id_user_id: { mess_id: messId, user_id: currentManager.user_id } },
          data: { role: MembershipRole.MEMBER },
        });

        // Update demoted user's global role if they have no other active MANAGER memberships
        const otherManagerCount = await this.prisma.messMembership.count({
          where: {
            user_id: currentManager.user_id,
            role: MembershipRole.MANAGER,
            is_active: true,
            mess_id: { not: messId },
          },
        });
        if (otherManagerCount === 0) {
          await this.prisma.user.update({
            where: { id: currentManager.user_id },
            data: { role: 'MEMBER' },
          });
        }
      }

      // Transfer mess ownership to the new manager so getAllMembers works correctly
      await this.prisma.mess.update({
        where: { id: messId },
        data: { created_by: userId },
      });

      // Update the target user's global role to MANAGER
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: 'MANAGER' },
      });
    }

    return this.prisma.messMembership.update({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar_url: true, phone: true, role: true } },
        mess: { select: { id: true, name: true } },
      },
    })
  }

  async getAllMembers(managerId: string, query: MessFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortOrder = 'desc' } = paginationHelper(paginationOptions);

    console.log(managerId);
    const manager = await this.prisma.user.findUnique({ where: { id: managerId } })
    console.log(manager);
    
    const where: Prisma.MessMembershipWhereInput = {
      mess: {
        created_by: managerId,   // Only messes owned by this manager
        is_active: true,
      },
      is_active: true,
    };

    // Search across user fields
    if (query.searchTerm) {
      where.user = {
        OR: [
          { name: { contains: query.searchTerm, mode: 'insensitive' } },
          { email: { contains: query.searchTerm, mode: 'insensitive' } },
          { phone: { contains: query.searchTerm, mode: 'insensitive' } },
        ],
      };
    }

    const [total, members] = await Promise.all([
      this.prisma.messMembership.count({ where }),
      this.prisma.messMembership.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joined_at: sortOrder as 'asc' | 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
              phone: true,
              role: true,
            },
          },
          mess: {   // Very important: show which mess they belong to
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      data: members,
      meta: buildMeta(total, page, limit),
    };
  }
}
