import { HttpException, Injectable } from '@nestjs/common';
import {
  CreateDepositDto,
  DepositFilterDto,
  UpdateDepositDto,
} from './dto/deposit.dto';
import { Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class DepositService {
  constructor(private readonly prisma: PrismaService) { }

  // ─────────────────────────────────────────
  // Verify mess access helper
  // ─────────────────────────────────────────
  private async verifyMessAccess(
    messId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    if (role === 'ADMIN') return;
    if (role === 'MANAGER' && mess.managerId === userId) return;

    const membership = await this.prisma.messMember.findUnique({
      where: { messId_userId: { messId, userId } },
    });
    if (!membership)
      throw new HttpException('Forbidden: You are not a member of this mess', 403);
  }

  // ─────────────────────────────────────────
  // Create deposit (Member adds own deposit)
  // ─────────────────────────────────────────
  async create(userId: string, role: string, dto: CreateDepositDto) {
    await this.verifyMessAccess(dto.messId, userId, role);

    const deposit = await this.prisma.deposit.create({
      data: {
        messId: dto.messId,
        userId,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : new Date(),
        note: dto.note,
      },
      include: {
        user: { select: { id: true, name: true } },
        mess: { select: { id: true, messName: true } },
      },
    });

    return deposit;
  }

  // ─────────────────────────────────────────
  // Get all deposits (Admin)
  // ─────────────────────────────────────────
  async findAll(query: DepositFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(
      paginationOptions as any,
    );

    const where: Prisma.DepositWhereInput = {};
    if (query.messId) where.messId = query.messId;
    if (query.userId) where.userId = query.userId;
    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    const [total, deposits] = await Promise.all([
      this.prisma.deposit.count({ where }),
      this.prisma.deposit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { id: true, name: true } },
          mess: { select: { id: true, messName: true } },
        },
      }),
    ]);

    // Aggregate total deposit amount
    const totalAmount = await this.prisma.deposit.aggregate({
      where,
      _sum: { amount: true },
    });

    return {
      data: deposits,
      meta: buildMeta(total, page, limit),
      totalAmount: totalAmount._sum.amount ?? 0,
    };
  }

  // ─────────────────────────────────────────
  // Get deposits by mess ID
  // ─────────────────────────────────────────
  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: DepositFilterDto,
  ) {
    await this.verifyMessAccess(messId, userId, role);

    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(
      paginationOptions as any,
    );

    const where: Prisma.DepositWhereInput = { messId };
    if (query.userId) where.userId = query.userId;
    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    const [total, deposits, totalAmount] = await Promise.all([
      this.prisma.deposit.count({ where }),
      this.prisma.deposit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { id: true, name: true, profileImage: true } },
        },
      }),
      this.prisma.deposit.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
      data: deposits,
      meta: buildMeta(total, page, limit),
      totalAmount: totalAmount._sum.amount ?? 0,
    };
  }

  // ─────────────────────────────────────────
  // Get single deposit
  // ─────────────────────────────────────────
  async findOne(id: string, userId: string, role: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        mess: { select: { id: true, messName: true } },
      },
    });

    if (!deposit) throw new HttpException('Deposit not found', 404);
    await this.verifyMessAccess(deposit.messId, userId, role);
    return deposit;
  }

  // ─────────────────────────────────────────
  // Update deposit (own or manager/admin)
  // ─────────────────────────────────────────
  async update(id: string, userId: string, role: string, dto: UpdateDepositDto) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw new HttpException('Deposit not found', 404);

    if (role === 'MEMBER' && deposit.userId !== userId) {
      throw new HttpException('Forbidden: Not your deposit', 403);
    }

    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({ where: { id: deposit.messId } });
      if (mess?.managerId !== userId)
        throw new HttpException('Forbidden: Not your mess', 403);
    }

    const updated = await this.prisma.deposit.update({
      where: { id },
      data: {
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        note: dto.note,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return updated;
  }

  // ─────────────────────────────────────────
  // Delete deposit
  // ─────────────────────────────────────────
  async remove(id: string, userId: string, role: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw new HttpException('Deposit not found', 404);

    if (role === 'MEMBER' && deposit.userId !== userId) {
      throw new HttpException('Forbidden: Not your deposit', 403);
    }

    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({ where: { id: deposit.messId } });
      if (mess?.managerId !== userId)
        throw new HttpException('Forbidden: Not your mess', 403);
    }

    await this.prisma.deposit.delete({ where: { id } });
    return { message: 'Deposit deleted successfully' };
  }
}
