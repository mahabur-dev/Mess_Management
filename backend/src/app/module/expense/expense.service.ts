import { HttpException, Injectable } from '@nestjs/common';
import {
  CreateExpenseDto,
  ExpenseFilterDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import { ExpenseCategory, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonthlyBillService } from '../monthly-bill/monthly-bill.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monthlyBillService: MonthlyBillService,
    private readonly notificationService: NotificationService,
  ) { }

  private async recalculateExpenseMonthBill(messId: string, date: Date) {
    await this.monthlyBillService.recalculateMonthlyBills(messId, date);
  }

  private isSameBillMonth(dateA: Date, dateB: Date) {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth()
    );
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


  async create(userId: string, role: string, dto: CreateExpenseDto) {
    await this.verifyManagerAccess(dto.messId, userId, role);

    const expense = await this.prisma.expense.create({
      data: {
        mess_id: dto.messId,
        created_by: userId,
        category: dto.category as ExpenseCategory,
        amount: dto.amount,
        expense_date: new Date(dto.expenseDate),
        description: dto.description,
        receipt_url: dto.receiptUrl,
        buyer_id: dto.buyerId,
        item_name: dto.itemName,
        quantity: dto.quantity,
        unit: dto.unit,
      },
      select: this.expenseSelect,
    });

    await this.recalculateExpenseMonthBill(dto.messId, expense.expense_date);

    // Send push notification to all active users
    await this.notificationService.sendPushToAll({
      title: `New Expense Added - ${expense.mess.name}`,
      body: `${expense.item_name || expense.category} - ${expense.amount}`,
      url: '/dashboard/expenses',
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
        orderBy: { [sortBy]: sortOrder },
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

  async update(id: string, userId: string, role: string, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new HttpException('Expense not found', 404);
    }

    await this.verifyManagerAccess(expense.mess_id, userId, role);

    const oldExpenseDate = expense.expense_date;

    const updatedExpense = await this.prisma.expense.update({
      where: { id },
      data: {
        category: dto.category,
        amount: dto.amount,
        expense_date: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        description: dto.description,
        receipt_url: dto.receiptUrl,
        buyer_id: dto.buyerId,
        item_name: dto.itemName,
        quantity: dto.quantity,
        unit: dto.unit,
      },
      select: this.expenseSelect,
    });

    await this.recalculateExpenseMonthBill(expense.mess_id, oldExpenseDate);

    if (!this.isSameBillMonth(oldExpenseDate, updatedExpense.expense_date)) {
      await this.recalculateExpenseMonthBill(
        expense.mess_id,
        updatedExpense.expense_date,
      );
    }

    return updatedExpense;
  }

  async remove(id: string, userId: string, role: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new HttpException('Expense not found', 404);
    }

    await this.verifyManagerAccess(expense.mess_id, userId, role);

    await this.prisma.expense.delete({
      where: { id },
    });

    await this.recalculateExpenseMonthBill(
      expense.mess_id,
      expense.expense_date,
    );

    return { message: 'Expense deleted successfully' };
  }

  private buildWhere(query: ExpenseFilterDto): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.category) where.category = query.category;
    if (query.startDate || query.endDate) {
      where.expense_date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }
    return where;
  }
}
