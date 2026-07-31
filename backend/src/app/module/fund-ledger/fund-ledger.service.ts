import { HttpException, Injectable } from '@nestjs/common';
import {
  DepositLedgerType,
  ExpensePaymentType,
  LedgerDirection,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import {
  CreateCollectedFundDto,
  FundLedgerFilterDto,
} from './dto/fund-ledger.dto';
import { calculateFundBalances } from './fund-balance-calculator';

export type FundLedgerClient =
  | Pick<PrismaService, 'depositLedger' | 'payment' | 'deposit'>
  | Prisma.TransactionClient;

@Injectable()
export class FundLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyMessMember(messId: string, userId: string, role: string) {
    if (role === 'ADMIN') return;
    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: { created_by: true },
    });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!membership?.is_active) {
      throw new HttpException('Forbidden: Not a member of this mess', 403);
    }
  }

  private async verifyManager(messId: string, userId: string, role: string) {
    if (role === 'ADMIN') return;
    const mess = await this.prisma.mess.findUnique({
      where: { id: messId },
      select: { created_by: true },
    });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (membership?.is_active && membership.role === 'MANAGER') return;
    throw new HttpException(
      'Forbidden: Only managers can manage collected funds',
      403,
    );
  }

  async calculateBalances(client: FundLedgerClient, messId: string) {
    const [
      approvedPayments,
      directDeposits,
      messExpenseDebits,
      collectedFundCredits,
      collectedFundDebits,
    ] = await Promise.all([
      client.payment.aggregate({
        where: { mess_id: messId, status: 'APPROVED' },
        _sum: { amount: true },
      }),
      client.deposit.aggregate({
        where: { mess_id: messId },
        _sum: { amount: true },
      }),
      client.depositLedger.aggregate({
        where: {
          mess_id: messId,
          type: DepositLedgerType.MESS_EXPENSE_DEBIT,
          direction: LedgerDirection.DEBIT,
        },
        _sum: { amount: true },
      }),
      client.depositLedger.aggregate({
        where: {
          mess_id: messId,
          type: DepositLedgerType.COLLECTED_FUND_IN,
          direction: LedgerDirection.CREDIT,
        },
        _sum: { amount: true },
      }),
      client.depositLedger.aggregate({
        where: {
          mess_id: messId,
          type: DepositLedgerType.COLLECTED_FUND_OUT,
          direction: LedgerDirection.DEBIT,
        },
        _sum: { amount: true },
      }),
    ]);

    return calculateFundBalances({
      approvedPayments: Number(approvedPayments._sum.amount ?? 0),
      directDeposits: Number(directDeposits._sum.amount ?? 0),
      messExpenseDebits: Number(messExpenseDebits._sum.amount ?? 0),
      collectedFundCredits: Number(collectedFundCredits._sum.amount ?? 0),
      collectedFundDebits: Number(collectedFundDebits._sum.amount ?? 0),
    });
  }

  async assertSufficientBalance(
    client: FundLedgerClient,
    messId: string,
    paidFrom: ExpensePaymentType,
    amount: number,
  ) {
    if (paidFrom === ExpensePaymentType.PERSONAL) return;
    const balances = await this.calculateBalances(client, messId);
    const available =
      paidFrom === ExpensePaymentType.COLLECTED_FUND
        ? balances.collectedFundBalance
        : balances.messDepositBalance;

    if (available < amount) {
      const label =
        paidFrom === ExpensePaymentType.COLLECTED_FUND
          ? 'collected fund'
          : 'deposit';
      throw new HttpException(
        `Insufficient ${label} balance. Required: ${amount}, Available: ${available}`,
        400,
      );
    }
  }

  async getBalances(messId: string, userId: string, role: string) {
    await this.verifyMessMember(messId, userId, role);
    return this.calculateBalances(this.prisma, messId);
  }

  async createCollectedFund(
    userId: string,
    role: string,
    dto: CreateCollectedFundDto,
  ) {
    await this.verifyManager(dto.messId, userId, role);
    const effectiveDate = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.$transaction(
      async (tx) => {
        const entry = await tx.depositLedger.create({
          data: {
            mess_id: dto.messId,
            member_id: userId,
            type: DepositLedgerType.COLLECTED_FUND_IN,
            direction: LedgerDirection.CREDIT,
            amount: dto.amount,
            effective_date: effectiveDate,
            note: dto.note?.trim() || 'Collected fund credit',
          },
          include: {
            member: { select: { id: true, name: true, email: true } },
          },
        });

        const balances = await this.calculateBalances(tx, dto.messId);
        return {
          ...entry,
          amount: Number(entry.amount),
          balance: balances.collectedFundBalance,
          balances,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 20_000,
      },
    );
  }

  async listCollectedFund(
    messId: string,
    userId: string,
    role: string,
    query: FundLedgerFilterDto,
  ) {
    await this.verifyManager(messId, userId, role);
    const { page, limit, skip } = paginationHelper(query);
    const where: Prisma.DepositLedgerWhereInput = {
      mess_id: messId,
      type: DepositLedgerType.COLLECTED_FUND_IN,
      direction: LedgerDirection.CREDIT,
    };
    const [total, entries] = await Promise.all([
      this.prisma.depositLedger.count({ where }),
      this.prisma.depositLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ effective_date: 'desc' }, { created_at: 'desc' }],
        include: {
          member: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);
    return {
      data: entries.map((entry) => ({
        ...entry,
        amount: Number(entry.amount),
      })),
      meta: buildMeta(total, page, limit),
    };
  }

  async removeCollectedFund(id: string, userId: string, role: string) {
    const entry = await this.prisma.depositLedger.findUnique({
      where: { id },
      select: { id: true, mess_id: true, type: true, direction: true },
    });
    if (
      !entry ||
      entry.type !== DepositLedgerType.COLLECTED_FUND_IN ||
      entry.direction !== LedgerDirection.CREDIT
    ) {
      throw new HttpException('Collected fund entry not found', 404);
    }
    await this.verifyManager(entry.mess_id, userId, role);

    await this.prisma.$transaction(
      async (tx) => {
        await tx.depositLedger.delete({ where: { id } });
        const balances = await this.calculateBalances(tx, entry.mess_id);
        if (balances.collectedFundBalance < 0) {
          throw new HttpException(
            'Cannot remove collected funds that have already been spent',
            400,
          );
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 20_000,
      },
    );

    return { message: 'Collected fund entry removed successfully' };
  }
}
