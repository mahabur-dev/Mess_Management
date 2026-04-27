import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  BazarFilterDto,
  CreateBazarDto,
  UpdateBazarDto,
} from './dto/bazar.dto';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { prisma } from '../../lib/prisma';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class BazarService {
  constructor(private readonly prisma: PrismaService) { }

  // ─────────────────────────────────────────
  // Helper: verify mess membership / ownership
  // ─────────────────────────────────────────
  private async verifyMessAccess(
    messId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    if (role === 'ADMIN') return;

    if (role === 'MANAGER') {
      if (mess.managerId !== userId)
        throw new HttpException('Forbidden: Not your mess', 403);
      return;
    }

    // MEMBER: must be enrolled in this mess
    const membership = await this.prisma.messMember.findUnique({
      where: { messId_userId: { messId, userId } },
    });
    if (!membership)
      throw new HttpException('Forbidden: You are not a member of this mess', 403);
  }

  // ─────────────────────────────────────────
  // Create bazar entry
  // ─────────────────────────────────────────
  async create(userId: string, role: string, dto: CreateBazarDto) {
    await this.verifyMessAccess(dto.messId, userId, role);

    // Calculate total price from items
    const totalPrice = dto.items.reduce((sum, item) => sum + item.price, 0);

    const bazar = await this.prisma.bazar.create({
      data: {
        messId: dto.messId,
        userId,
        name: dto.name,
        date: dto.date ? new Date(dto.date) : new Date(),
        totalPrice,
        items: {
          create: dto.items.map((item) => ({
            itemName: item.itemName,
            price: item.price,
          })),
        },
      },
      include: {
        items: true,
        user: { select: { id: true, name: true } },
        mess: { select: { id: true, messName: true } },
      },
    });

    return bazar;
  }

  // ─────────────────────────────────────────
  // Get all bazars (Admin)
  // ─────────────────────────────────────────
  async findAll(query: BazarFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(
      paginationOptions as any,
    );

    const where: Prisma.BazarWhereInput = {};

    if (query.searchTerm) {
      where.name = { contains: query.searchTerm, mode: 'insensitive' };
    }
    if (query.messId) where.messId = query.messId;
    if (query.userId) where.userId = query.userId;
    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    const [total, bazars] = await Promise.all([
      this.prisma.bazar.count({ where }),
      this.prisma.bazar.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: true,
          user: { select: { id: true, name: true } },
          mess: { select: { id: true, messName: true } },
        },
      }),
    ]);

    return {
      data: bazars,
      meta: buildMeta(total, page, limit),
    };
  }

  // ─────────────────────────────────────────
  // Get bazars by mess ID (Manager/Admin/Member)
  // ─────────────────────────────────────────
  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: BazarFilterDto,
  ) {
    await this.verifyMessAccess(messId, userId, role);

    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(
      paginationOptions as any,
    );

    const where: Prisma.BazarWhereInput = { messId };

    if (query.searchTerm) {
      where.name = { contains: query.searchTerm, mode: 'insensitive' };
    }
    if (query.userId) where.userId = query.userId;
    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    const [total, bazars] = await Promise.all([
      this.prisma.bazar.count({ where }),
      this.prisma.bazar.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: true,
          user: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      data: bazars,
      meta: buildMeta(total, page, limit),
    };
  }

  // ─────────────────────────────────────────
  // Get single bazar by ID
  // ─────────────────────────────────────────
  async findOne(id: string, userId: string, role: string) {
    const bazar = await this.prisma.bazar.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, name: true } },
        mess: { select: { id: true, messName: true } },
      },
    });

    if (!bazar) throw new HttpException('Bazar entry not found', 404);

    await this.verifyMessAccess(bazar.messId, userId, role);
    return bazar;
  }

  // ─────────────────────────────────────────
  // Update bazar (owner or manager/admin)
  // ─────────────────────────────────────────
  async update(
    id: string,
    userId: string,
    role: string,
    dto: UpdateBazarDto,
  ) {
    const bazar = await this.prisma.bazar.findUnique({ where: { id } });
    if (!bazar) throw new HttpException('Bazar entry not found', 404);

    // Members can only edit their own entries
    if (role === 'MEMBER' && bazar.userId !== userId) {
      throw new HttpException('Forbidden: Not your bazar entry', 403);
    }

    // Manager can only edit entries in their mess
    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({ where: { id: bazar.messId } });
      if (mess?.managerId !== userId)
        throw new HttpException('Forbidden: Not your mess', 403);
    }

    // If items updated, recalculate total
    let totalPrice = bazar.totalPrice;
    let itemsUpdate: Prisma.BazarUpdateInput['items'] = undefined;

    if (dto.items) {
      totalPrice = dto.items.reduce((sum, item) => sum + item.price, 0) as any;
      itemsUpdate = {
        deleteMany: {},
        create: dto.items.map((item) => ({
          itemName: item.itemName,
          price: item.price,
        })),
      };
    }

    const updated = await this.prisma.bazar.update({
      where: { id },
      data: {
        name: dto.name,
        date: dto.date ? new Date(dto.date) : undefined,
        totalPrice,
        items: itemsUpdate,
      },
      include: { items: true, user: { select: { id: true, name: true } } },
    });

    return updated;
  }

  // ─────────────────────────────────────────
  // Delete bazar entry
  // ─────────────────────────────────────────
  async remove(id: string, userId: string, role: string) {
    const bazar = await this.prisma.bazar.findUnique({ where: { id } });
    if (!bazar) throw new HttpException('Bazar entry not found', 404);

    if (role === 'MEMBER' && bazar.userId !== userId) {
      throw new HttpException('Forbidden: Not your bazar entry', 403);
    }

    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({ where: { id: bazar.messId } });
      if (mess?.managerId !== userId)
        throw new HttpException('Forbidden: Not your mess', 403);
    }

    await this.prisma.bazar.delete({ where: { id } });
    return { message: 'Bazar entry deleted successfully' };
  }
}
