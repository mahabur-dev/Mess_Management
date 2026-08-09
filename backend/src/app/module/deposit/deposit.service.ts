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
import { MonthlyBillReconciliationService } from '../monthly-bill/monthly-bill-reconciliation.service';

export type PreparedDeposit = {
  messId: string;
  memberId: string;
  depositDate: Date;
  amount: number;
  note?: string;
};

@Injectable()
export class DepositService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billReconciliation: MonthlyBillReconciliationService,
  ) {}

  private monthRange(monthInput: string) {
    const match = /^(\d{4})-(\d{2})/.exec(monthInput);
    if (!match) throw new HttpException('Invalid bill month', 400);
    const start = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
    );
    return { start, end };
  }

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

  private async verifyManagerAccess(
    messId: string,
    userId: string,
    role: string,
  ) {
    if (role === 'ADMIN') return;
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (membership?.is_active && membership.role === 'MANAGER') return;
    throw new HttpException(
      'Forbidden: Only managers can record direct deposits',
      403,
    );
  }

  private async ensureActiveMember(messId: string, memberId: string) {
    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: { created_by: true },
    });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === memberId) return;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: memberId } },
    });
    if (!membership?.is_active) {
      throw new HttpException(
        'Selected member is not active in this mess',
        400,
      );
    }
  }

  /** Shared validation boundary used by manual and AI workflows. */
  async prepareCreate(
    userId: string,
    role: string,
    dto: CreateDepositDto,
  ): Promise<PreparedDeposit> {
    await this.verifyManagerAccess(dto.messId, userId, role);
    const memberId = dto.memberId ?? userId;
    await this.ensureActiveMember(dto.messId, memberId);
    return {
      messId: dto.messId,
      memberId,
      depositDate: dto.date ? new Date(dto.date) : new Date(),
      amount: dto.amount,
      note: dto.note,
    };
  }

  /** Shared write boundary. The caller owns the transaction. */
  async persistCreate(
    tx: Prisma.TransactionClient,
    userId: string,
    prepared: PreparedDeposit,
  ) {
    return tx.deposit.create({
      data: {
        mess_id: prepared.messId,
        member_id: prepared.memberId,
        amount: prepared.amount,
        method: PaymentMethod.CASH,
        deposit_date: prepared.depositDate,
        note: prepared.note,
        confirmed_by: userId,
        confirmed_at: new Date(),
      },
      include: {
        member: { select: { id: true, name: true } },
        mess: { select: { id: true, name: true } },
      },
    });
  }

  /** Post-commit effects shared by manual and AI creation. */
  async completeCreate(prepared: PreparedDeposit, deposit: any) {
    const billingSync = await this.billReconciliation.reconcile(
      prepared.messId,
      prepared.depositDate,
    );
    return { ...deposit, date: deposit.deposit_date, billingSync };
  }

  async create(userId: string, role: string, dto: CreateDepositDto) {
    const prepared = await this.prepareCreate(userId, role, dto);
    const deposit = await this.prisma.$transaction((tx) =>
      this.persistCreate(tx, userId, prepared),
    );
    return this.completeCreate(prepared, deposit);
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
    const safeSortBy =
      sortBy === 'date'
        ? 'deposit_date'
        : ['deposit_date', 'created_at', 'amount'].includes(sortBy)
          ? sortBy
          : 'deposit_date';

    const where = this.buildWhere(query);
    const [total, deposits, totalAmount] = await Promise.all([
      this.prisma.deposit.count({ where }),
      this.prisma.deposit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: sortOrder },
        include: {
          member: { select: { id: true, name: true } },
          mess: { select: { id: true, name: true } },
        },
      }),
      this.prisma.deposit.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
      data: deposits.map((deposit) => ({
        ...deposit,
        date: deposit.deposit_date,
      })),
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
    return { ...deposit, date: deposit.deposit_date };
  }

  async update(
    id: string,
    userId: string,
    role: string,
    dto: UpdateDepositDto,
  ) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw new HttpException('Deposit not found', 404);
    await this.verifyManagerAccess(deposit.mess_id, userId, role);
    const previousDate = deposit.deposit_date;
    const nextDate = dto.date ? new Date(dto.date) : previousDate;

    const updated = await this.prisma.deposit.update({
      where: { id },
      data: {
        amount: dto.amount,
        deposit_date: nextDate,
        note: dto.note,
      },
      include: { member: { select: { id: true, name: true } } },
    });
    const billingSync = await this.billReconciliation.reconcile(
      deposit.mess_id,
      previousDate,
      nextDate,
    );
    return { ...updated, date: updated.deposit_date, billingSync };
  }

  async remove(id: string, userId: string, role: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id } });
    if (!deposit) throw new HttpException('Deposit not found', 404);
    await this.verifyManagerAccess(deposit.mess_id, userId, role);

    await this.prisma.deposit.delete({ where: { id } });
    const billingSync = await this.billReconciliation.reconcile(
      deposit.mess_id,
      deposit.deposit_date,
    );
    return { message: 'Deposit deleted successfully', billingSync };
  }

  private buildWhere(query: DepositFilterDto): Prisma.DepositWhereInput {
    const where: Prisma.DepositWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.userId) where.member_id = query.userId;
    if (query.billMonth) {
      const { start, end } = this.monthRange(query.billMonth);
      where.deposit_date = { gte: start, lt: end };
    } else if (query.startDate || query.endDate) {
      where.deposit_date = {
        ...(query.startDate && { gte: new Date(`${query.startDate}T00:00:00.000Z`) }),
        ...(query.endDate && { lte: new Date(`${query.endDate}T23:59:59.999Z`) }),
      };
    }
    return where;
  }
}
