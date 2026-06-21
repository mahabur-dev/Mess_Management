import { HttpException, Injectable } from '@nestjs/common';
import {
  CompleteMessSetupDto,
  CreateMessDto,
  MessFilterDto,
  RequestMessRegistrationDto,
  ReviewMessRequestDto,
  UpdateMemberDto,
  UpdateMessDto,
} from './dto/mess.dto';
import { MembershipRole, Prisma, RequestStatus } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonthlyBillService } from '../monthly-bill/monthly-bill.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlyBillService: MonthlyBillService,
    private readonly notificationService: NotificationService,
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

    const result = await this.prisma.$transaction(async (tx) => {
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
              endDate.setDate(endDate.getDate() + 7);
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
    });

    void this.notificationService.sendPushToUsers([request.requester_id], {
      title: 'Your mess is approved',
      body: 'A 7-day free trial has started. You can upgrade anytime from the dashboard.',
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
  // async create(organizerId: string, dto: CreateMessDto) {
  //   // Verify organizer exists
  //   const organizer = await this.prisma.user.findUnique({
  //     where: { id: organizerId },
  //   });
  //   if (!organizer) throw new HttpException('Organizer not found', 404);

  //   const mess = await this.prisma.mess.create({
  //     data: {
  //       name: dto.messName,
  //       address: dto.messLocation,
  //       description: dto.description,
  //       created_by: organizerId,
  //       meal_rate: dto.meal_rate,
  //       currency: dto.currency,
  //       memberships: {
  //         create: {
  //           user_id: organizerId,
  //           role: MembershipRole.MANAGER,
  //           created_by: organizerId,
  //         },
  //       },
  //     },
  //     select: this.messSelect,
  //   });

  //   return mess;
  // }

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

    if (!mess || mess.length === 0) throw new HttpException('You have not created a mess yet', 404);
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
      (requesterRole === 'MANAGER' || requesterRole === 'ORGANIZER') &&
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
      (requesterRole === 'MANAGER' || requesterRole === 'ORGANIZER') &&
      mess.created_by !== requesterId
    ) {
      throw new HttpException('Forbidden: Not your mess', 403);
    } else if (
      requesterRole !== 'MANAGER' &&
      requesterRole !== 'ORGANIZER' &&
      requesterRole !== 'ADMIN'
    ) {
      throw new HttpException('Forbidden', 403);
    }

    await this.prisma.mess.delete({ where: { id: messId } });
    return { message: 'Mess deleted successfully' };
  }

  // ─────────────────────────────────────────
  // Add member to mess (Organizer)
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

  async addMember(messId: string, organizerId: string, email: string, role: MembershipRole, dto?: Partial<UpdateMemberDto>) {
    await this.verifyManagerAccess(messId, organizerId, 'MANAGER');

    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: { id: true, rooms: true },
    });
    if (!mess) throw new HttpException('Mess not found', 404);

    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) throw new HttpException('User not found', 404);

    const activeMembership = await this.prisma.messMembership.findFirst({
      where: {
        user_id: user.id,
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
        `User is already active in ${activeMembership.mess?.name ?? 'another mess'}`,
        400,
      );
    }

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

    const member = await this.prisma.messMembership.create({
      data: {
        mess_id: messId,
        user_id: user.id,
        role: role,
        created_by: organizerId,
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
  async removeMember(messId: string, userId: string, organizerId: string) {
    await this.verifyManagerAccess(messId, organizerId, 'MANAGER');

    const member = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!member)
      throw new HttpException('User is not a member of this mess', 404);

    await this.prisma.messMembership.update({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
      data: { is_active: false, left_at: new Date() },
    });

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

  async assignManager(messId: string, userId: string, role: MembershipRole, organizerId: string) {

    // Make sure the organizer owns this mess
    const organizer = await this.prisma.user.findUnique({ where: { id: organizerId } })

    if (!organizer) throw new HttpException('Forbidden', 403)

    const mess = await this.prisma.mess.findUnique({ where: { id: messId } })
    if (!mess || mess.created_by !== organizerId) throw new HttpException('Forbidden: Not your mess', 403)
    // Update MessMembership role
    const memberShip = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } }
    })

    if (!memberShip) throw new HttpException('User is not a member of this mess', 404)

    return this.prisma.messMembership.update({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true, avatar_url: true, phone: true, role: true } },
        mess: { select: { id: true, name: true } },
      },
    })
  }

  async getAllMembers(organizerId: string, query: MessFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortOrder = 'desc' } = paginationHelper(paginationOptions);

    const where: Prisma.MessMembershipWhereInput = {
      mess: {
        created_by: organizerId,   // Only messes owned by this organizer
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
