import { HttpException, Injectable } from '@nestjs/common';
import {
  AddMemberDto,
  CreateMessDto,
  MessFilterDto,
  UpdateMessDto,
} from './dto/mess.dto';
import type { MessWhereInput, MessMemberWhereInput } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';

@Injectable()
export class MessService {
  constructor(private readonly prisma: PrismaService) {}

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
        messName: dto.messName,
        messLocation: dto.messLocation,
        managerId,
        managerPhone: dto.managerPhone,
        managerEmail: dto.managerEmail,
      },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return mess;
  }

  // ─────────────────────────────────────────
  // Get all messes (Admin)
  // ─────────────────────────────────────────
  async findAll(query: MessFilterDto) {
    const paginationOptions = pick(query, [
      'page', 'limit', 'sortBy', 'sortOrder',
    ]);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(
      paginationOptions as any,
    );

    const where: MessWhereInput = {};

    if (query.searchTerm) {
      where.OR = [
        { messName: { contains: query.searchTerm, mode: 'insensitive' } },
        { messLocation: { contains: query.searchTerm, mode: 'insensitive' } },
        { managerEmail: { contains: query.searchTerm, mode: 'insensitive' } },
      ];
    }

    const [total, messes] = await Promise.all([
      this.prisma.mess.count({ where }),
      this.prisma.mess.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          manager: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true } },
        },
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
      where: { managerId },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: {
              select: {
                id: true, name: true, email: true,
                profileImage: true, mobileNumber: true,
              },
            },
          },
        },
        _count: { select: { members: true, bazars: true, deposits: true } },
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
        manager: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: {
              select: {
                id: true, name: true, email: true,
                profileImage: true, mobileNumber: true,
              },
            },
          },
        },
        _count: { select: { members: true } },
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

    if (requesterRole === 'MANAGER' && mess.managerId !== requesterId) {
      throw new HttpException('Forbidden: Not your mess', 403);
    }

    const updated = await this.prisma.mess.update({
      where: { id: messId },
      data: dto,
      include: {
        manager: { select: { id: true, name: true, email: true } },
      },
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
  async addMember(messId: string, managerId: string, dto: AddMemberDto) {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.managerId !== managerId)
      throw new HttpException('Forbidden: Not your mess', 403);

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new HttpException('User not found', 404);

    const existing = await this.prisma.messMember.findUnique({
      where: { messId_userId: { messId, userId: dto.userId } },
    });
    if (existing) throw new HttpException('User is already a member', 400);

    const member = await this.prisma.messMember.create({
      data: { messId, userId: dto.userId },
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
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.managerId !== managerId)
      throw new HttpException('Forbidden: Not your mess', 403);

    const member = await this.prisma.messMember.findUnique({
      where: { messId_userId: { messId, userId } },
    });
    if (!member) throw new HttpException('User is not a member of this mess', 404);

    await this.prisma.messMember.delete({
      where: { messId_userId: { messId, userId } },
    });

    return { message: 'Member removed successfully' };
  }

  // ─────────────────────────────────────────
  // Get members of a mess
  // ─────────────────────────────────────────
  async getMembers(messId: string, query: MessFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortOrder } = paginationHelper(
      paginationOptions as any,
    );

    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    const where: MessMemberWhereInput = { messId };

    if (query.searchTerm) {
      where.user = {
        OR: [
          { name: { contains: query.searchTerm, mode: 'insensitive' } },
          { email: { contains: query.searchTerm, mode: 'insensitive' } },
        ],
      };
    }

    const [total, members] = await Promise.all([
      this.prisma.messMember.count({ where }),
      this.prisma.messMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joinedAt: sortOrder },
        include: {
          user: {
            select: {
              id: true, name: true, email: true,
              profileImage: true, mobileNumber: true, role: true,
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