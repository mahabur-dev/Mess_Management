import { HttpException, Injectable } from '@nestjs/common';
import { NotificationType, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreatePaymentDto,
  PaymentFilterDto,
  ReviewPaymentDto,
  UpdatePaymentDto,
} from './dto/payment.dto';
import {
  canEditPayment,
  statusForPaymentWrite,
} from './payment-approval.policy';
import {
  type BillingSyncStatus,
  MonthlyBillReconciliationService,
} from '../monthly-bill/monthly-bill-reconciliation.service';
import sendMailer from 'src/app/helpers/sendMailer';
import { NotificationService } from '../notification/notification.service';

export type PreparedPayment = {
  messId: string;
  memberId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: Date;
  monthlyBillId?: string;
  transactionId?: string;
  screenshotUrl?: string;
  note?: string;
  categories: string[];
  canManage: boolean;
};

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billReconciliation: MonthlyBillReconciliationService,
    private readonly notificationService: NotificationService,
  ) {}

  private async getPaymentRecalculateDate(payment: {
    monthly_bill_id: string | null;
    payment_date: Date | null;
    created_at: Date;
  }) {
    if (payment.monthly_bill_id) {
      const bill = await this.prisma.monthlyBill.findUnique({
        where: { id: payment.monthly_bill_id },
        select: { month: true },
      });

      if (bill) return bill.month;
    }

    return payment.payment_date ?? payment.created_at;
  }

  private monthRange(monthInput: string) {
    const match = /^(\d{4})-(\d{2})/.exec(monthInput);
    if (!match) throw new HttpException('Invalid bill month', 400);
    const start = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
    );
    return { start, end };
  }

  private readonly paymentSelect = {
    id: true,
    monthly_bill_id: true,
    amount: true,
    method: true,
    status: true,
    categories: true,
    transaction_id: true,
    screenshot_url: true,
    note: true,
    payment_date: true,
    approved_at: true,
    created_at: true,
    mess: { select: { id: true, name: true } },
    member: { select: { id: true, name: true, email: true, avatar_url: true } },
    creator: { select: { id: true, name: true, email: true, avatar_url: true } },
    monthly_bill: {
      select: { id: true, month: true, final_due: true, status: true },
    },
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
    if (!membership?.is_active)
      throw new HttpException('Forbidden: Not a member of this mess', 403);
  }

  private async ensureActiveMessMember(messId: string, userId: string) {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });

    if (!membership?.is_active) {
      throw new HttpException(
        'Forbidden: Selected member is not active in this mess',
        403,
      );
    }
  }

  private async hasManagerAccess(
    messId: string,
    userId: string,
    role: string,
  ) {
    if (role === 'ADMIN') return true;
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return true;
    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    return Boolean(membership?.is_active && membership.role === 'MANAGER');
  }

  private async verifyManager(messId: string, userId: string, role: string) {
    if (await this.hasManagerAccess(messId, userId, role)) return;
    throw new HttpException(
      'Forbidden: Only managers can approve payments',
      403,
    );
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

  async prepareCreate(
    userId: string,
    role: string,
    dto: CreatePaymentDto,
  ): Promise<PreparedPayment> {
    await this.verifyMessMember(dto.messId, userId, role);
    await this.ensureActiveSubscription(dto.messId, role);

    const canManage = await this.hasManagerAccess(dto.messId, userId, role);

    const purchasedById = dto.purchasedBy?.trim() || userId;
    if (purchasedById !== userId && !canManage) {
      throw new HttpException(
        'Forbidden: Members can submit deposits only for themselves',
        403,
      );
    }
    await this.ensureActiveMessMember(dto.messId, purchasedById);

    if (dto.monthlyBillId) {
      const monthlyBill = await this.prisma.monthlyBill.findUnique({
        where: { id: dto.monthlyBillId },
        select: { mess_id: true, member_id: true },
      });
      if (!monthlyBill) {
        throw new HttpException('Monthly bill not found', 404);
      }
      if (
        monthlyBill.mess_id !== dto.messId ||
        monthlyBill.member_id !== purchasedById
      ) {
        throw new HttpException(
          'Monthly bill must belong to the selected member and mess',
          400,
        );
      }
    }

    return {
      messId: dto.messId,
      memberId: purchasedById,
      amount: dto.amount,
      method: dto.method,
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
      monthlyBillId: dto.monthlyBillId,
      transactionId: dto.transactionId,
      screenshotUrl: dto.screenshotUrl,
      note: dto.note,
      categories: dto.categories ?? [],
      canManage,
    };
  }

  async persistCreate(
    tx: Prisma.TransactionClient,
    userId: string,
    prepared: PreparedPayment,
  ) {
    return tx.payment.create({
      data: {
        mess_id: prepared.messId,
        member_id: prepared.memberId,
        created_by: userId,
        monthly_bill_id: prepared.monthlyBillId,
        amount: prepared.amount,
        method: prepared.method,
        categories: prepared.categories,
        transaction_id: prepared.transactionId,
        screenshot_url: prepared.screenshotUrl,
        note: prepared.note,
        payment_date: prepared.paymentDate,
        status: statusForPaymentWrite(prepared.canManage),
        approved_by: prepared.canManage ? userId : null,
        approved_at: prepared.canManage ? new Date() : null,
      },
      select: this.paymentSelect,
    });
  }

  async completeCreate(
    userId: string,
    prepared: PreparedPayment,
    payment: Awaited<ReturnType<PaymentService['persistCreate']>>,
  ) {
    const billingSync = prepared.canManage
      ? await this.billReconciliation.reconcile(
          prepared.messId,
          await this.getPaymentRecalculateDate(payment),
        )
      : null;

    if (!prepared.canManage) {
      const managerUserIds =
        await this.notificationService.resolveMessManagerUserIds(prepared.messId);

      await this.notificationService
        .createForMess(
          userId,
          prepared.messId,
          NotificationType.PAYMENT_NOTICE,
          `Payment Submitted - ${payment.mess.name}`,
          `${payment.member.name} submitted ${Number(payment.amount).toLocaleString()} via ${payment.method}.`,
          {
            source: 'PAYMENT',
            paymentId: payment.id,
            status: payment.status,
          },
          managerUserIds,
          '/payments',
          `payment-submitted-${payment.id}`,
        )
        .catch(() => {
          // Payment submission should not fail if notification delivery fails.
        });
    }

    return { ...payment, billingSync };
  }

  async create(userId: string, role: string, dto: CreatePaymentDto) {
    const prepared = await this.prepareCreate(userId, role, dto);
    const payment = await this.prisma.$transaction((tx) =>
      this.persistCreate(tx, userId, prepared),
    );
    return this.completeCreate(userId, prepared, payment);
  }

  async findAll(query: PaymentFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);
    const safeSortBy = [
      'payment_date',
      'created_at',
      'amount',
      'status',
    ].includes(sortBy)
      ? sortBy
      : 'created_at';
    const where = this.buildWhere(query);

    const [total, payments, aggregate] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: sortOrder },
        select: this.paymentSelect,
      }),
      this.prisma.payment.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
      data: payments,
      meta: buildMeta(total, page, limit),
      totalAmount: aggregate._sum.amount ?? 0,
    };
  }

  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: PaymentFilterDto,
  ) {
    await this.verifyMessMember(messId, userId, role);
    return this.findAll({ ...query, messId });
  }

  async findMyPayments(userId: string, query: PaymentFilterDto) {
    return this.findAll({ ...query, memberId: userId });
  }

  async findOne(id: string, userId: string, role: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      select: this.paymentSelect,
    });
    if (!payment) throw new HttpException('Payment not found', 404);
    await this.verifyMessMember(payment.mess.id, userId, role);
    return payment;
  }

  async update(
    id: string,
    userId: string,
    role: string,
    dto: UpdatePaymentDto,
  ) {
    const existing = await this.prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new HttpException('Payment not found', 404);

    await this.verifyMessMember(existing.mess_id, userId, role);
    await this.ensureActiveSubscription(existing.mess_id, role);
    const canManage = await this.hasManagerAccess(
      existing.mess_id,
      userId,
      role,
    );
    if (!canEditPayment(canManage, userId, existing.created_by)) {
      throw new HttpException(
        'Forbidden: Members can edit only deposits they submitted',
        403,
      );
    }

    const previousDate = await this.getPaymentRecalculateDate(existing);
    const status = statusForPaymentWrite(canManage);
    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        amount: dto.amount,
        method: dto.method,
        transaction_id:
          dto.transactionId === undefined
            ? undefined
            : dto.transactionId.trim() || null,
        screenshot_url:
          dto.screenshotUrl === undefined
            ? undefined
            : dto.screenshotUrl.trim() || null,
        note: dto.note === undefined ? undefined : dto.note.trim() || null,
        payment_date: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        categories: dto.categories,
        status,
        approved_by: canManage ? userId : null,
        approved_at: canManage ? new Date() : null,
      },
      select: this.paymentSelect,
    });

    const billingSync =
      existing.status === PaymentStatus.APPROVED ||
      updated.status === PaymentStatus.APPROVED
        ? await this.billReconciliation.reconcile(
            existing.mess_id,
            previousDate,
            await this.getPaymentRecalculateDate(updated),
          )
        : null;

    return { ...updated, billingSync };
  }

  async review(
    id: string,
    userId: string,
    role: string,
    dto: ReviewPaymentDto,
  ) {
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

    let billingSync: BillingSyncStatus = 'SYNCED';
    if (dto.status === PaymentStatus.APPROVED) {
      const recalculateDate = await this.getPaymentRecalculateDate(payment);
      billingSync = await this.billReconciliation.reconcile(
        payment.mess_id,
        recalculateDate,
      );
    }

    await this.notificationService
      .createForMess(
        userId,
        payment.mess_id,
        dto.status === PaymentStatus.APPROVED
          ? NotificationType.DEPOSIT_CONFIRMED
          : NotificationType.PAYMENT_NOTICE,
        dto.status === PaymentStatus.APPROVED
          ? 'Deposit approved'
          : 'Deposit rejected',
        dto.status === PaymentStatus.APPROVED
          ? `Your deposit of ${Number(payment.amount).toLocaleString()} has been approved.`
          : `Your deposit of ${Number(payment.amount).toLocaleString()} has been rejected.`,
        {
          source: 'PAYMENT_REVIEW',
          paymentId: payment.id,
          status: dto.status,
        },
        [payment.member_id],
        '/payments',
        `payment-review-${payment.id}-${dto.status.toLowerCase()}`,
      )
      .catch(() => {
        // Payment review should not fail if notification delivery fails.
      });

    return { ...updatedPayment, billingSync };
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
    const isOwnSubmission = payment.created_by === userId;
    const isMember = role === 'MEMBER';
    if (isMember) {
      const canManage = await this.hasManagerAccess(
        payment.mess_id,
        userId,
        role,
      );
      if (!canManage && !isOwnSubmission) {
        throw new HttpException(
          'Forbidden: Members can delete only deposits they submitted',
          403,
        );
      }
      if (!canManage && payment.status !== PaymentStatus.PENDING) {
        throw new HttpException(
          'Reviewed payments can only be deleted by a manager',
          400,
        );
      }
    } else {
      await this.verifyManager(payment.mess_id, userId, role);
    }

    // If manager deletes someone else's payment, send email
    if (!isMember && !isOwn && payment.member?.email) {
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
        await sendMailer(
          payment.member.email,
          `Payment Deleted - ${payment.mess.name}`,
          html,
        );
      } catch (e) {
        console.error('Failed to send deletion email:', e);
      }
    }

    const recalculateDate =
      payment.status === PaymentStatus.APPROVED
        ? await this.getPaymentRecalculateDate(payment)
        : null;
    await this.prisma.payment.delete({ where: { id } });
    const billingSync = recalculateDate
      ? await this.billReconciliation.reconcile(
          payment.mess_id,
          recalculateDate,
        )
      : 'SYNCED';
    return { message: 'Payment deleted successfully', billingSync };
  }

  private buildWhere(query: PaymentFilterDto): Prisma.PaymentWhereInput {
    const where: Prisma.PaymentWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.memberId) where.member_id = query.memberId;
    if (query.status) where.status = query.status;
    if (query.billMonth) {
      const { start, end } = this.monthRange(query.billMonth);
      where.OR = [
        { monthly_bill: { month: start } },
        {
          monthly_bill_id: null,
          payment_date: { gte: start, lt: end },
        },
        {
          monthly_bill_id: null,
          payment_date: null,
          created_at: { gte: start, lt: end },
        },
      ];
    } else if (query.startDate || query.endDate) {
      const dateFilter = {
        ...(query.startDate && {
          gte: new Date(`${query.startDate}T00:00:00.000Z`),
        }),
        ...(query.endDate && {
          lte: new Date(`${query.endDate}T23:59:59.999Z`),
        }),
      };
      where.OR = [
        { payment_date: dateFilter },
        { payment_date: null, created_at: dateFilter },
      ];
    }
    return where;
  }
}
