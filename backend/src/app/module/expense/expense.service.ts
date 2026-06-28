import { HttpException, Injectable } from '@nestjs/common';
import {
  CreateExpenseDto,
  ExpenseFilterDto,
  RequestPriceReviewDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import { ExpenseCategory, ExpensePaymentType, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonthlyBillService } from '../monthly-bill/monthly-bill.service';
import { NotificationService } from '../notification/notification.service';
import { uploadToCloudinary } from 'src/app/helpers/fileUploder';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlyBillService: MonthlyBillService,
    private readonly notificationService: NotificationService,
  ) {}

  private async recalculateExpenseMonthBill(messId: string, date: Date) {
    await this.monthlyBillService.recalculateMonthlyBills(messId, date);
  }

  private isSameBillMonth(dateA: Date, dateB: Date) {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth()
    );
  }

  /**
   * When an expense is marked as PERSONAL, auto-create a deposit entry
   * for the creator so their personal contribution is tracked in the deposit system.
   */
  private async handlePersonalPaymentExpense(
    messId: string,
    userId: string,
    amount: number,
    expenseId: string,
    expenseDate: Date,
  ) {
    await this.prisma.deposit.create({
      data: {
        mess_id: messId,
        member_id: userId,
        amount,
        note: `Personal expense contribution (expense: ${expenseId})`,
        method: 'CASH',
        confirmed_by: userId,
        confirmed_at: new Date(),
      },
    });
  }

  private readonly expenseSelect = {
    id: true,
    category: true,
    amount: true,
    description: true,
    receipt_url: true,
    buyer_id: true,
    item_name: true,
    quantity: true,
    unit: true,
    expense_date: true,
    payment_type: true,
    created_at: true,
    mess: { select: { id: true, name: true } },
    creator: { select: { id: true, name: true, email: true } },
  } as const;

  private async verifyManagerAccess(
    messId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    if (role === 'ADMIN') return;

    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    if (role === 'MANAGER' && mess.created_by === userId) return;
    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (membership?.is_active && membership.role === 'MANAGER') return;

    throw new HttpException('Forbidden: Only managers can manage expenses', 403);
  }

  private async verifyMessMemberAccess(
    messId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    if (role === 'ADMIN') return;

    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });

    if (membership?.is_active) return;

    throw new HttpException('Forbidden: Not a member of this mess', 403);
  }

  private verifyExpenseOwner(expense: { created_by: string }, userId: string) {
    if (expense.created_by !== userId) {
      throw new HttpException('Forbidden: You can edit only your own expenses', 403);
    }
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
        'Your subscription has expired. Please renew it to continue using expense features.',
        403,
      );
    }
  }

  async create(
    userId: string,
    role: string,
    dto: CreateExpenseDto,
    receipt?: Express.Multer.File,
  ) {
    await this.verifyMessMemberAccess(dto.messId, userId, role);
    await this.ensureActiveSubscription(dto.messId, role);

    const receiptUrl = receipt
      ? (
          await uploadToCloudinary(receipt, 'mess_management/expenses', {
            allowedTypes: ['image', 'pdf'],
            maxSizeBytes: 10 * 1024 * 1024,
          })
        ).url
      : dto.receiptUrl;

    const paymentType = dto.paymentType ?? ExpensePaymentType.FROM_DEPOSIT;

    // Validate deposit balance before creating FROM_DEPOSIT expense
    if (paymentType === ExpensePaymentType.FROM_DEPOSIT) {
      const deposit = await this.prisma.deposit.aggregate({
        where: {
          mess_id: dto.messId,
          member_id: userId,
        },
        _sum: { amount: true },
      });
      const currentBalance = Number(deposit._sum.amount ?? 0);
      if (currentBalance < dto.amount) {
        throw new HttpException(
          `Insufficient deposit balance. Required: ${dto.amount}, Available: ${currentBalance}`,
          400,
        );
      }
    }

    const expense = await this.prisma.expense.create({
      data: {
        mess_id: dto.messId,
        created_by: userId,
        category: dto.category as ExpenseCategory,
        amount: dto.amount,
        expense_date: new Date(dto.expenseDate),
        description: dto.description,
        receipt_url: receiptUrl,
        buyer_id: dto.buyerId,
        item_name: dto.itemName,
        quantity: dto.quantity,
        unit: dto.unit,
        payment_type: paymentType,
      },
      select: this.expenseSelect,
    });

    // Handle personal payment: auto-create deposit entry
    if (paymentType === ExpensePaymentType.PERSONAL) {
      await this.handlePersonalPaymentExpense(
        dto.messId,
        userId,
        dto.amount,
        expense.id,
        expense.expense_date,
      );
    }

    // Recalculate monthly bills for both FROM_DEPOSIT and PERSONAL expenses
    await this.recalculateExpenseMonthBill(dto.messId, expense.expense_date);

    // Send push notification to all active users
    await this.notificationService.sendPushToAll({
      title: `New Expense Added - ${expense.mess.name}`,
      body: `${expense.item_name || expense.category} - ${expense.amount} [${paymentType}]`,
      url: '/',
      data: {
        messId: expense.mess.id,
        expenseId: expense.id,
        type: 'EXPENSE',
      },
    }).catch(() => {
      // Silently fail if push notification fails
    });

    return expense;
  }

  async findAll(query: ExpenseFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);

    const where = this.buildWhere(query);

    const [total, expenses, aggregate] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
        select: this.expenseSelect,
      }),
      this.prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
      data: expenses,
      meta: buildMeta(total, page, limit),
      totalAmount: aggregate._sum.amount ?? 0,
    };
  }

  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: ExpenseFilterDto,
  ) {
    if (role !== 'ADMIN') {
      const membership = await this.prisma.messMembership.findUnique({
        where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
      });
      const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
      if (!mess) throw new HttpException('Mess not found', 404);
      if (!membership?.is_active && mess.created_by !== userId) {
        throw new HttpException('Forbidden: Not a member of this mess', 403);
      }
    }

    return this.findAll({ ...query, messId });
  }

  async findOne(id: string, userId: string, role: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      select: this.expenseSelect,
    });

    if (!expense) throw new HttpException('Expense not found', 404);

    if (role !== 'ADMIN') {
      const membership = await this.prisma.messMembership.findUnique({
        where: {
          mess_id_user_id: { mess_id: expense.mess.id, user_id: userId },
        },
      });
      const mess = await this.prisma.mess.findUnique({
        where: { id: expense.mess.id },
      });
      if (!membership?.is_active && mess?.created_by !== userId) {
        throw new HttpException('Forbidden: Not a member of this mess', 403);
      }
    }

    return expense;
  }

  async update(
    id: string,
    userId: string,
    role: string,
    dto: UpdateExpenseDto,
    receipt?: Express.Multer.File,
  ) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new HttpException('Expense not found', 404);
    }

    await this.verifyMessMemberAccess(expense.mess_id, userId, role);
    this.verifyExpenseOwner(expense, userId);
    await this.ensureActiveSubscription(expense.mess_id, role);

    const oldExpenseDate = expense.expense_date;
    const oldPaymentType = expense.payment_type;
    const oldAmount = expense.amount;
    const oldCreatedBy = expense.created_by;

    const receiptUrl = receipt
      ? (
          await uploadToCloudinary(receipt, 'mess_management/expenses', {
            allowedTypes: ['image', 'pdf'],
            maxSizeBytes: 10 * 1024 * 1024,
          })
        ).url
      : dto.receiptUrl;

    const paymentType = dto.paymentType as ExpensePaymentType | undefined;

    const updatedExpense = await this.prisma.expense.update({
      where: { id },
      data: {
        category: dto.category,
        amount: dto.amount,
        expense_date: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        description: dto.description,
        receipt_url: receiptUrl,
        buyer_id: dto.buyerId,
        item_name: dto.itemName,
        quantity: dto.quantity,
        unit: dto.unit,
        payment_type: paymentType,
      },
      select: this.expenseSelect,
    });

    // Handle personal payment deposit changes
    const wasPersonal = oldPaymentType === ExpensePaymentType.PERSONAL;
    const isNowPersonal = paymentType === ExpensePaymentType.PERSONAL;

    if (wasPersonal && !isNowPersonal) {
      // Changed from personal to FROM_DEPOSIT: remove the auto-created deposit
      await this.prisma.deposit.deleteMany({
        where: {
          mess_id: expense.mess_id,
          member_id: oldCreatedBy,
          note: { contains: `expense: ${id}` },
        },
      });
    } else if (!wasPersonal && isNowPersonal && dto.amount) {
      // Changed FROM_DEPOSIT to personal: create deposit
      await this.handlePersonalPaymentExpense(
        expense.mess_id,
        oldCreatedBy,
        dto.amount,
        id,
        updatedExpense.expense_date,
      );
    } else if (wasPersonal && isNowPersonal && dto.amount && dto.amount !== Number(oldAmount)) {
      // Still personal but amount changed: remove old deposit and create new
      await this.prisma.deposit.deleteMany({
        where: {
          mess_id: expense.mess_id,
          member_id: oldCreatedBy,
          note: { contains: `expense: ${id}` },
        },
      });
      await this.handlePersonalPaymentExpense(
        expense.mess_id,
        oldCreatedBy,
        dto.amount,
        id,
        updatedExpense.expense_date,
      );
    }

    // Recalculate monthly bills for any payment type change
    await this.recalculateExpenseMonthBill(expense.mess_id, oldExpenseDate);
    if (!this.isSameBillMonth(oldExpenseDate, updatedExpense.expense_date)) {
      await this.recalculateExpenseMonthBill(
        expense.mess_id,
        updatedExpense.expense_date,
      );
    }

    return updatedExpense;
  }

  async requestPriceReview(
    id: string,
    userId: string,
    role: string,
    dto: RequestPriceReviewDto,
  ) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      select: {
        id: true,
        mess_id: true,
        created_by: true,
        item_name: true,
        category: true,
        amount: true,
        mess: { select: { id: true, name: true } },
      },
    });

    if (!expense) {
      throw new HttpException('Expense not found', 404);
    }

    await this.verifyManagerAccess(expense.mess_id, userId, role);
    await this.ensureActiveSubscription(expense.mess_id, role);

    const message = dto.message.trim();
    const itemLabel = expense.item_name || expense.category;

    const result = await this.notificationService.sendPushToUser(
      expense.created_by,
      {
        title: `Price review requested - ${expense.mess.name}`,
        body: message,
        url: '/dashboard/finance',
        data: {
          messId: expense.mess.id,
          expenseId: expense.id,
          itemName: itemLabel,
          amount: String(expense.amount),
          type: 'EXPENSE_PRICE_REVIEW',
        },
      },
    );

    return {
      expenseId: expense.id,
      targetUserId: expense.created_by,
      ...result,
    };
  }

  async remove(id: string, userId: string, role: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new HttpException('Expense not found', 404);
    }

    await this.verifyManagerAccess(expense.mess_id, userId, role);
    await this.ensureActiveSubscription(expense.mess_id, role);

    // If personal expense, remove the associated deposit entry first
    if (expense.payment_type === ExpensePaymentType.PERSONAL) {
      await this.prisma.deposit.deleteMany({
        where: {
          mess_id: expense.mess_id,
          member_id: expense.created_by,
          note: { contains: `expense: ${id}` },
        },
      });
    }

    await this.prisma.expense.delete({
      where: { id },
    });

    // Recalculate monthly bills for both FROM_DEPOSIT and PERSONAL
    const shouldRecalculate = expense.payment_type === ExpensePaymentType.FROM_DEPOSIT || expense.payment_type === ExpensePaymentType.PERSONAL;

    if (shouldRecalculate) {
      await this.recalculateExpenseMonthBill(
        expense.mess_id,
        expense.expense_date,
      );
    }

    return { message: 'Expense deleted successfully' };
  }

  private buildWhere(query: ExpenseFilterDto): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.category) where.category = query.category;
    if (query.userName) {
      where.creator = {
        name: {
          contains: query.userName,
          mode: 'insensitive',
        },
      };
    }
    if (query.startDate || query.endDate) {
      where.expense_date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }
    return where;
  }
}
