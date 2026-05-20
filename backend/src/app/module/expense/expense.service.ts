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

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.expense.create({
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
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new HttpException('Expense not found', 404);

    await this.verifyManagerAccess(expense.mess_id, userId, role);

    return this.prisma.expense.update({
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
  }

  async remove(id: string, userId: string, role: string) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new HttpException('Expense not found', 404);

    await this.verifyManagerAccess(expense.mess_id, userId, role);

    await this.prisma.expense.delete({ where: { id } });
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
