import { HttpException, Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto, PaymentFilterDto, ReviewPaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly paymentSelect = {
    id: true,
    amount: true,
    method: true,
    status: true,
    transaction_id: true,
    screenshot_url: true,
    note: true,
    approved_at: true,
    created_at: true,
    mess: { select: { id: true, name: true } },
    member: { select: { id: true, name: true, email: true } },
    monthly_bill: { select: { id: true, month: true, final_due: true, status: true } },
    approver: { select: { id: true, name: true, email: true } },
  } as const;

  private async verifyMessMember(messId: string, userId: string, role: string) {
    if (role === 'ADMIN') return;
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;
    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!membership?.is_active) throw new HttpException('Forbidden: Not a member of this mess', 403);
  }

  private async verifyManager(messId: string, userId: string, role: string) {
    if (role === 'ADMIN') return;
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;
    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (membership?.is_active && membership.role === 'MANAGER') return;
    throw new HttpException('Forbidden: Only managers can approve payments', 403);
  }

  async create(userId: string, role: string, dto: CreatePaymentDto) {
    await this.verifyMessMember(dto.messId, userId, role);

    return this.prisma.payment.create({
      data: {
        mess_id: dto.messId,
        member_id: userId,
        monthly_bill_id: dto.monthlyBillId,
        amount: dto.amount,
        method: dto.method,
        transaction_id: dto.transactionId,
        screenshot_url: dto.screenshotUrl,
        note: dto.note,
      },
      select: this.paymentSelect,
    });
  }

  async findAll(query: PaymentFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(paginationOptions);
    const where = this.buildWhere(query);

    const [total, payments, aggregate] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder }, select: this.paymentSelect }),
      this.prisma.payment.aggregate({ where, _sum: { amount: true } }),
    ]);

    return { data: payments, meta: buildMeta(total, page, limit), totalAmount: aggregate._sum.amount ?? 0 };
  }

  async findByMess(messId: string, userId: string, role: string, query: PaymentFilterDto) {
    await this.verifyMessMember(messId, userId, role);
    return this.findAll({ ...query, messId });
  }

  async findMyPayments(userId: string, query: PaymentFilterDto) {
    return this.findAll({ ...query, memberId: userId });
  }

  async review(id: string, userId: string, role: string, dto: ReviewPaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new HttpException('Payment not found', 404);
    await this.verifyManager(payment.mess_id, userId, role);
    if (payment.status !== PaymentStatus.PENDING) throw new HttpException('Payment has already been reviewed', 400);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status: dto.status,
          note: dto.note ?? payment.note,
          approved_by: userId,
          approved_at: new Date(),
        },
        select: this.paymentSelect,
      });

      if (dto.status === PaymentStatus.APPROVED && payment.monthly_bill_id) {
        const approved = await tx.payment.aggregate({
          where: { monthly_bill_id: payment.monthly_bill_id, status: PaymentStatus.APPROVED },
          _sum: { amount: true },
        });
        const bill = await tx.monthlyBill.findUnique({ where: { id: payment.monthly_bill_id } });
        if (bill) {
          const paidAmount = Number(approved._sum.amount ?? 0);
          const finalDue = Math.max(Number(bill.final_due) - paidAmount, 0);
          await tx.monthlyBill.update({
            where: { id: bill.id },
            data: {
              paid_amount: paidAmount,
              balance: finalDue,
              status: finalDue <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING',
            },
          });
        }
      }

      return updated;
    });
  }

  private buildWhere(query: PaymentFilterDto): Prisma.PaymentWhereInput {
    const where: Prisma.PaymentWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.memberId) where.member_id = query.memberId;
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
      where.created_at = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }
    return where;
  }
}
