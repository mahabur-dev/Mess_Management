import { HttpException, Injectable } from '@nestjs/common';
import {
  AddMemberDto,
  CreateMessDto,
  MessFilterDto,
  UpdateMessDto,
} from './dto/mess.dto';
import { GlobalRole, MembershipRole, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class MessService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly messSelect = {
    id: true,
    name: true,
    description: true,
    address: true,
    meal_rate: true,
    currency: true,
    created_by: true,
    is_active: true,
    created_at: true,
    creator: { select: { id: true, name: true, email: true } },
    _count: { select: { memberships: true, deposits: true, meals: true } },
  } as const;

  // ─────────────────────────────────────────
  // Create mess (Manager creates own mess)
  // ─────────────────────────────────────────
  async create(managerId: string, dto: CreateMessDto) {
    // Verify manager exists
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
    });
    if (!manager) throw new HttpException('Manager not found', 404);

    const mess = await this.prisma.mess.create({
      data: {
        name: dto.messName,
        address: dto.messLocation,
        created_by: managerId,
        meal_rate: 0,
        memberships: {
          create: {
            user_id: managerId,
            role: 'MANAGER',
          },
        },
      },
      select: this.messSelect,
    });

    return mess;
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
  // Get my mess (Manager)
  // ─────────────────────────────────────────
  async findMyMess(managerId: string) {
    const mess = await this.prisma.mess.findFirst({
      where: { created_by: managerId },
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

    if (!mess) throw new HttpException('You have not created a mess yet', 404);
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

    if (requesterRole === 'MANAGER' && mess.created_by !== requesterId) {
      throw new HttpException('Forbidden: Not your mess', 403);
    }

    const updated = await this.prisma.mess.update({
      where: { id: messId },
      data: {
        name: dto.messName,
        address: dto.messLocation,
      },
      select: this.messSelect,
    });

    return updated;
  }

  // ─────────────────────────────────────────
  // Delete mess (Admin only)
  // ─────────────────────────────────────────
  async remove(messId: string) {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    await this.prisma.mess.delete({ where: { id: messId } });
    return { message: 'Mess deleted successfully' };
  }

  // ─────────────────────────────────────────
  // Add member to mess (Manager)
  // ─────────────────────────────────────────
  async addMember(userId: string, messId: string) {
    
    console.log('Adding member', { userId, messId });
    const mess = await this.prisma.user.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    if(mess.id !== messId && mess.role !== 'ORGANIZER') {
     throw new HttpException('Forbidden: Not your mess', 403);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new HttpException('User not found', 404);

    const existing = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (existing) throw new HttpException('User is already a member', 400);

    const member = await this.prisma.messMembership.create({
      data: { mess_id: messId, user_id: userId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return member;
  }

  // ─────────────────────────────────────────
  // Remove member from mess (Manager)
  // ─────────────────────────────────────────
  async removeMember(messId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: messId } });
    if (!user) throw new HttpException('Mess not found', 404);

    if(user.id !== messId && user.role !== 'ORGANIZER') {
      throw new HttpException('Forbidden: Not your mess', 403);
    }

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

  async assignManager(organizerId: string, userId: string, role: MembershipRole) {

    // Make sure the organizer owns this mess
    const organizer = await this.prisma.user.findUnique({ where: { id: organizerId } })

    if (!organizer || organizer.role !== 'ORGANIZER' || organizer.id !== organizerId) throw new HttpException('Forbidden', 403)

    // Update MessMembership role
    await this.prisma.messMembership.update({
      where: { mess_id_user_id: { mess_id: organizer.id, user_id: userId } },
      data: { role: MembershipRole.MANAGER }
    })

    // Also update GlobalRole on User table
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: GlobalRole.MANAGER }
    })
}

  // ─────────────────────────────────────────
  // Get members of a mess
  // ─────────────────────────────────────────
  async getMembers(messId: string, query: MessFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip, sortOrder } =
      paginationHelper(paginationOptions);

    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    const where: Prisma.MessMembershipWhereInput = {
      mess_id: messId,
      is_active: true,
    };

    if (query.searchTerm) {
      where.user = {
        OR: [
          { name: { contains: query.searchTerm, mode: 'insensitive' } },
          { email: { contains: query.searchTerm, mode: 'insensitive' } },
        ],
      };
    }

    const [total, members] = await Promise.all([
      this.prisma.messMembership.count({ where }),
      this.prisma.messMembership.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joined_at: sortOrder },
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
        },
      }),
    ]);

    return {
      data: members,
      meta: buildMeta(total, page, limit),
    };
  }
}
