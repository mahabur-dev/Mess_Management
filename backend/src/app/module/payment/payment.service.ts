import { HttpException, Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePaymentDto, PaymentFilterDto, ReviewPaymentDto } from './dto/payment.dto';
import { MonthlyBillService } from '../monthly-bill/monthly-bill.service';
import sendMailer from 'src/app/helpers/sendMailer';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlyBillService: MonthlyBillService,
  ) { }

  private async getPaymentRecalculateDate(payment: {
    monthly_bill_id: string | null;
    created_at: Date;
  }) {
    if (payment.monthly_bill_id) {
      const bill = await this.prisma.monthlyBill.findUnique({
        where: { id: payment.monthly_bill_id },
        select: { month: true },
      });

      if (bill) return bill.month;
    }

    return payment.created_at;
  }

  private async recalculatePaymentMonthBill(messId: string, date: Date) {
    await this.monthlyBillService.recalculateMonthlyBills(messId, date);
  }

  private readonly paymentSelect = {
    id: true,
    amount: true,
    method: true,
    status: true,
    categories: true,
    transaction_id: true,
    screenshot_url: true,
    note: true,
    approved_at: true,
    created_at: true,
    mess: { select: { id: true, name: true } },
    member: { select: { id: true, name: true, email: true } },
    creator: { select: { id: true, name: true, email: true } },
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

  private async ensureActiveMessMember(messId: string, userId: string) {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });

    if (!membership?.is_active) {
      throw new HttpException('Forbidden: Selected member is not active in this mess', 403);
    }
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

  private async ensureActiveSubscription(messId: string, role: string) {
    if (role === 'ADMIN') return;

    const subscription = await this.prisma.subscription.findUnique({
      where: { mess_id: messId },
      select: { status: true, end_date: true },
    });

    const isActive =
      subscription?.status === 'ACTIVE' &&
      (!subscription.end_date || subscription.end_date.getTime() >= Date.now());

    if (!isActive) {
      throw new HttpException(
        'Your subscription has expired. Please renew it to continue using payment features.',
        403,
      );
    }
  }

  async create(userId: string, role: string, dto: CreatePaymentDto) {
    await this.verifyMessMember(dto.messId, userId, role);
    await this.ensureActiveSubscription(dto.messId, role);

    const purchasedById = dto.purchasedBy?.trim() || userId;
    if (purchasedById !== userId) {
      await this.verifyManager(dto.messId, userId, role);
    }
    await this.ensureActiveMessMember(dto.messId, purchasedById);

    return this.prisma.payment.create({
      data: {
        mess_id: dto.messId,
        member_id: purchasedById,
        created_by: userId,
        monthly_bill_id: dto.monthlyBillId,
        amount: dto.amount,
        method: dto.method,
        categories: dto.categories ?? [],
        transaction_id: dto.transactionId,
        screenshot_url: dto.screenshotUrl,
        note: dto.note,
        payment_date: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
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
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new HttpException('Payment not found', 404);
    }

    await this.verifyManager(payment.mess_id, userId, role);
    await this.ensureActiveSubscription(payment.mess_id, role);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new HttpException('Payment has already been reviewed', 400);
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: dto.status,
        note: dto.note ?? payment.note,
        approved_by: dto.status === PaymentStatus.APPROVED ? userId : null,
        approved_at: dto.status === PaymentStatus.APPROVED ? new Date() : null,
      },
      select: this.paymentSelect,
    });

    if (dto.status === PaymentStatus.APPROVED) {
      const recalculateDate = await this.getPaymentRecalculateDate(payment);

      await this.recalculatePaymentMonthBill(
        payment.mess_id,
        recalculateDate,
      );
    }

    return updatedPayment;
  }

  async remove(id: string, userId: string, role: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, name: true, email: true } },
        mess: { select: { id: true, name: true } },
      },
    });
    if (!payment) throw new HttpException('Payment not found', 404);

    const isOwn = payment.member_id === userId;
    const isManager = role === 'ADMIN' || role === 'MANAGER' || role === 'ORGANIZER';

    // Member can only delete own payment
    if (role === 'MEMBER' && !isOwn) {
      throw new HttpException('Forbidden: You can only delete your own payment', 403);
    }

    // Manager check
    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({
        where: { id: payment.mess_id },
      });
      if (mess?.created_by !== userId) {
        throw new HttpException('Forbidden: Not your mess', 403);
      }
    }

    // If manager deletes someone else's payment, send email
    if (isManager && !isOwn && payment.member?.email) {
      try {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafcff; border-radius: 12px;">
            <div style="background: linear-gradient(135deg, #2f80ed, #3b8cff); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h2 style="color: #fff; margin: 0; font-size: 20px;">Payment Deleted</h2>
            </div>
            <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e6ebf4;">
              <p style="color: #172554; font-size: 16px; font-weight: 600;">Hello ${payment.member.name},</p>
              <p style="color: #53617d; font-size: 14px; line-height: 1.6;">
                Your payment of <strong style="color: #dc2626;">৳ ${Number(payment.amount).toLocaleString()}</strong> 
                in <strong>${payment.mess.name}</strong> has been deleted by a manager.
              </p>
              <div style="background: #f8faff; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0; color: #6b7a99; font-size: 13px;">Amount: <strong style="color: #172554;">৳ ${Number(payment.amount).toLocaleString()}</strong></p>
                <p style="margin: 4px 0; color: #6b7a99; font-size: 13px;">Date: <strong style="color: #172554;">${new Date(payment.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></p>
              </div>
              <p style="color: #53617d; font-size: 14px;">If you have any questions, please contact your mess manager.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/payments" 
                 style="display: inline-block; background: linear-gradient(135deg, #2f80ed, #3b8cff); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View All Payments
              </a>
            </div>
          </div>
        `;
        await sendMailer(payment.member.email, `Payment Deleted - ${payment.mess.name}`, html);
      } catch (e) {
        console.error('Failed to send deletion email:', e);
      }
    }

    await this.prisma.payment.delete({ where: { id } });
    return { message: 'Payment deleted successfully' };
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
