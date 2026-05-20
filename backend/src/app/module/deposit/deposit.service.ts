import { HttpException, Injectable } from '@nestjs/common';
import {
  CreateDepositDto,
  DepositFilterDto,
  UpdateDepositDto,
} from './dto/deposit.dto';
import { PaymentMethod, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DepositService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(userId: string, role: string, dto: CreateDepositDto) {
    await this.verifyMessAccess(dto.messId, userId, role);

    return this.prisma.deposit.create({
      data: {
        mess_id: dto.messId,
        member_id: userId,
        amount: dto.amount,
        method: PaymentMethod.CASH,
        note: dto.note,
      },
      include: {
        member: { select: { id: true, name: true } },
        mess: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: DepositFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);

    const where = this.buildWhere(query);
    const [total, deposits, totalAmount] = await Promise.all([
      this.prisma.deposit.count({ where }),
      this.prisma.deposit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          member: { select: { id: true, name: true } },
          mess: { select: { id: true, name: true } },
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

  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: DepositFilterDto,
  ) {
    await this.verifyMessAccess(messId, userId, role);

    return this.findAll({ ...query, messId });
  }

  async findOne(id: string, userId: string, role: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, name: true } },
        mess: { select: { id: true, name: true } },
      },
    });

    if (!deposit) throw new HttpException('Deposit not found', 404);
    await this.verifyMessAccess(deposit.mess_id, userId, role);
    return deposit;
  }

  async update(
    id: string,
    userId: string,
    role: string,
    dto: UpdateDepositDto,
  ) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw new HttpException('Deposit not found', 404);

    if (role === 'MEMBER' && deposit.member_id !== userId) {
      throw new HttpException('Forbidden: Not your deposit', 403);
    }

    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({
        where: { id: deposit.mess_id },
      });
      if (mess?.created_by !== userId) {
        throw new HttpException('Forbidden: Not your mess', 403);
      }
    }

    return this.prisma.deposit.update({
      where: { id },
      data: {
        amount: dto.amount,
        note: dto.note,
      },
      include: { member: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, userId: string, role: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw new HttpException('Deposit not found', 404);

    if (role === 'MEMBER' && deposit.member_id !== userId) {
      throw new HttpException('Forbidden: Not your deposit', 403);
    }

    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({
        where: { id: deposit.mess_id },
      });
      if (mess?.created_by !== userId) {
        throw new HttpException('Forbidden: Not your mess', 403);
      }
    }

    await this.prisma.deposit.delete({ where: { id } });
    return { message: 'Deposit deleted successfully' };
  }

  private buildWhere(query: DepositFilterDto): Prisma.DepositWhereInput {
    const where: Prisma.DepositWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.userId) where.member_id = query.userId;
    if (query.startDate || query.endDate) {
      where.created_at = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }
    return where;
  }
}
