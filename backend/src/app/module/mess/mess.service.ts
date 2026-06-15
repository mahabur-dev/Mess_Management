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
    const pending = await this.prisma.messRequest.findFirst({
      where: { requester_id: userId, status: RequestStatus.PENDING },
    });
    if (pending) throw new HttpException('You already have a pending mess registration request', 400);

    const request = await this.prisma.messRequest.create({
      data: {
        requester_id: userId,
        mess_name: dto.messName,
        address: dto.address,
        total_seats: dto.totalSeats,
        monthly_rent: dto.monthlyRent,
        description: dto.description,
      },
      include: { requester: { select: { id: true, name: true, email: true, phone: true } } },
    });

    const adminUserIds = await this.notificationService.resolveAdminUserIds();
    await this.notificationService.sendPushToUsers(adminUserIds, {
      title: 'New mess registration request',
      body: `${request.requester.name} requested approval for ${request.mess_name}.`,
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

    return this.prisma.$transaction(async (tx) => {
      const mess = await tx.mess.create({
        data: {
          name: request.mess_name,
          address: request.address,
          description: request.description,
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
    return mess;
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
    return mess;
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

  async addMember(messId: string, organizerId: string, email: string, role: MembershipRole, dto?: Partial<UpdateMemberDto>) {
    await this.verifyManagerAccess(messId, organizerId, 'MANAGER');

    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) throw new HttpException('User not found', 404);

    const existing = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: user.id } },
    });
    if (existing) throw new HttpException('User is already a member', 400);

    const member = await this.prisma.messMembership.create({
      data: {
        mess_id: messId,
        user_id: user.id,
        role: role,
        created_by: organizerId,
        room_no: dto?.roomNo,
        seat_no: dto?.seatNo,
        monthly_rent: dto?.monthlyRent,
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
    const member = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!member) throw new HttpException('User is not a member of this mess', 404);

    return this.prisma.messMembership.update({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
      data: {
        role: dto.role,
        is_active: dto.isActive,
        left_at: dto.isActive === false ? new Date() : dto.isActive === true ? null : undefined,
        room_no: dto.roomNo,
        seat_no: dto.seatNo,
        monthly_rent: dto.monthlyRent,
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
