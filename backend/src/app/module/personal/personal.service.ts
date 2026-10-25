import { HttpException, Injectable } from '@nestjs/common';
import { PersonalTransactionType, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateFamilyMemberDto,
  CreatePersonalBudgetDto,
  CreatePersonalTransactionDto,
  PersonalTransactionFilterDto,
  UpdateFamilyMemberDto,
  UpdatePersonalBudgetDto,
  UpdatePersonalTransactionDto,
} from './dto/personal.dto';
import {
  calculatePersonalSummary,
  isPersonalCategoryAllowed,
  personalMonthRange,
} from './personal-finance.policy';

@Injectable()
export class PersonalService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly transactionSelect = {
    id: true,
    type: true,
    category: true,
    amount: true,
    date: true,
    description: true,
    family_member_id: true,
    created_at: true,
    updated_at: true,
    family_member: {
      select: { id: true, name: true, relation: true },
    },
  } as const;

  private readonly familySelect = {
    id: true,
    name: true,
    relation: true,
    created_at: true,
    updated_at: true,
  } as const;

  private normalizeCategory(type: PersonalTransactionType, value: string) {
    const category = value.trim().toUpperCase();
    if (!isPersonalCategoryAllowed(type, category)) {
      throw new HttpException(`Invalid ${type.toLowerCase()} category`, 400);
    }
    return category;
  }

  private monthRange(value?: string) {
    try {
      return personalMonthRange(value);
    } catch {
      throw new HttpException('Invalid month. Use YYYY-MM format', 400);
    }
  }

  private transactionDate(value: string) {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new HttpException('Invalid transaction date', 400);
    }
    return date;
  }

  private async verifyFamilyMember(
    userId: string,
    familyMemberId?: string | null,
  ) {
    if (!familyMemberId) return null;
    const familyMember = await this.prisma.familyMember.findFirst({
      where: { id: familyMemberId, user_id: userId },
      select: { id: true },
    });
    if (!familyMember) throw new HttpException('Family member not found', 404);
    return familyMember.id;
  }

  /**
   * Single business entry point for transaction creation. Future input
   * adapters (including AI) must call this method instead of writing directly.
   */
  async createPersonalTransaction(
    userId: string,
    dto: CreatePersonalTransactionDto,
  ) {
    const category = this.normalizeCategory(dto.type, dto.category);
    const familyMemberId = await this.verifyFamilyMember(
      userId,
      dto.familyMemberId,
    );

    return this.prisma.personalTransaction.create({
      data: {
        user_id: userId,
        type: dto.type,
        category,
        amount: dto.amount,
        date: this.transactionDate(dto.date),
        description: dto.description?.trim() || null,
        family_member_id: familyMemberId,
      },
      select: this.transactionSelect,
    });
  }

  async findTransactions(userId: string, query: PersonalTransactionFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const pagination = paginationHelper(paginationOptions);
    const allowedSortFields = new Set([
      'date',
      'amount',
      'created_at',
      'updated_at',
    ]);
    const sortBy = allowedSortFields.has(pagination.sortBy)
      ? pagination.sortBy
      : 'date';
    const where: Prisma.PersonalTransactionWhereInput = { user_id: userId };

    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category.trim().toUpperCase();
    if (query.familyMemberId) where.family_member_id = query.familyMemberId;
    if (query.month) {
      const range = this.monthRange(query.month);
      where.date = { gte: range.start, lt: range.end };
    }
    if (query.search?.trim()) {
      where.OR = [
        { description: { contains: query.search.trim(), mode: 'insensitive' } },
        { category: { contains: query.search.trim(), mode: 'insensitive' } },
        {
          family_member: {
            is: {
              name: { contains: query.search.trim(), mode: 'insensitive' },
            },
          },
        },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.personalTransaction.count({ where }),
      this.prisma.personalTransaction.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: [{ [sortBy]: pagination.sortOrder }, { created_at: 'desc' }],
        select: this.transactionSelect,
      }),
    ]);

    return {
      data,
      meta: buildMeta(total, pagination.page, pagination.limit),
    };
  }

  async updateTransaction(
    userId: string,
    id: string,
    dto: UpdatePersonalTransactionDto,
  ) {
    const existing = await this.prisma.personalTransaction.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing)
      throw new HttpException('Personal transaction not found', 404);

    const type = dto.type ?? existing.type;
    const category = this.normalizeCategory(
      type,
      dto.category ?? existing.category,
    );
    const familyMemberId =
      dto.familyMemberId === undefined
        ? existing.family_member_id
        : await this.verifyFamilyMember(userId, dto.familyMemberId);

    return this.prisma.personalTransaction.update({
      where: { id },
      data: {
        type,
        category,
        amount: dto.amount,
        date: dto.date ? this.transactionDate(dto.date) : undefined,
        description:
          dto.description === undefined
            ? undefined
            : dto.description.trim() || null,
        family_member_id: familyMemberId,
      },
      select: this.transactionSelect,
    });
  }

  async removeTransaction(userId: string, id: string) {
    const removed = await this.prisma.personalTransaction.deleteMany({
      where: { id, user_id: userId },
    });
    if (!removed.count)
      throw new HttpException('Personal transaction not found', 404);
    return { message: 'Personal transaction deleted successfully' };
  }

  async getSummary(userId: string, month?: string) {
    const range = this.monthRange(month);
    const [groups, recentTransactions] = await Promise.all([
      this.prisma.personalTransaction.groupBy({
        by: ['type'],
        where: { user_id: userId, date: { gte: range.start, lt: range.end } },
        _sum: { amount: true },
      }),
      this.prisma.personalTransaction.findMany({
        where: {
          user_id: userId,
          date: { gte: range.start, lt: range.end },
        },
        take: 10,
        orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
        select: this.transactionSelect,
      }),
    ]);
    const amounts = groups.reduce<
      Partial<Record<PersonalTransactionType, number>>
    >((result, group) => {
      result[group.type] = Number(group._sum.amount ?? 0);
      return result;
    }, {});

    return {
      month: range.start,
      ...calculatePersonalSummary(amounts),
      recentTransactions,
    };
  }

  async getReports(userId: string, month?: string) {
    const range = this.monthRange(month);
    const [summary, breakdown] = await Promise.all([
      this.getSummary(userId, month),
      this.prisma.personalTransaction.groupBy({
        by: ['category'],
        where: {
          user_id: userId,
          type: PersonalTransactionType.EXPENSE,
          date: { gte: range.start, lt: range.end },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
    ]);

    return {
      ...summary,
      expenseCategoryBreakdown: breakdown.map((item) => ({
        category: item.category,
        amount: Number(item._sum.amount ?? 0),
      })),
    };
  }

  async createFamilyMember(userId: string, dto: CreateFamilyMemberDto) {
    return this.prisma.familyMember.create({
      data: {
        user_id: userId,
        name: dto.name.trim(),
        relation: dto.relation.trim().toUpperCase(),
      },
      select: this.familySelect,
    });
  }

  async findFamilyMembers(userId: string, month?: string) {
    const range = this.monthRange(month);
    const [members, expenses] = await Promise.all([
      this.prisma.familyMember.findMany({
        where: { user_id: userId },
        orderBy: [{ name: 'asc' }],
        select: this.familySelect,
      }),
      this.prisma.personalTransaction.groupBy({
        by: ['family_member_id', 'category'],
        where: {
          user_id: userId,
          type: PersonalTransactionType.EXPENSE,
          family_member_id: { not: null },
          date: { gte: range.start, lt: range.end },
        },
        _sum: { amount: true },
      }),
    ]);
    const summary = new Map<
      string,
      { total: number; categories: Record<string, number> }
    >();
    for (const expense of expenses) {
      if (!expense.family_member_id) continue;
      const current = summary.get(expense.family_member_id) ?? {
        total: 0,
        categories: {},
      };
      const amount = Number(expense._sum.amount ?? 0);
      current.total += amount;
      current.categories[expense.category] = amount;
      summary.set(expense.family_member_id, current);
    }

    return members.map((member) => ({
      ...member,
      monthlyExpense: Number((summary.get(member.id)?.total ?? 0).toFixed(2)),
      categoryBreakdown: summary.get(member.id)?.categories ?? {},
    }));
  }

  async updateFamilyMember(
    userId: string,
    id: string,
    dto: UpdateFamilyMemberDto,
  ) {
    const existing = await this.prisma.familyMember.findFirst({
      where: { id, user_id: userId },
      select: { id: true },
    });
    if (!existing) throw new HttpException('Family member not found', 404);

    return this.prisma.familyMember.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        relation: dto.relation?.trim().toUpperCase(),
      },
      select: this.familySelect,
    });
  }

  async removeFamilyMember(userId: string, id: string) {
    const removed = await this.prisma.familyMember.deleteMany({
      where: { id, user_id: userId },
    });
    if (!removed.count) throw new HttpException('Family member not found', 404);
    return { message: 'Family member deleted successfully' };
  }

  async createBudget(userId: string, dto: CreatePersonalBudgetDto) {
    const month = this.monthRange(dto.month).start;
    const category = this.normalizeCategory(
      PersonalTransactionType.EXPENSE,
      dto.category,
    );
    try {
      return await this.prisma.personalBudget.create({
        data: {
          user_id: userId,
          month,
          category,
          limit_amount: dto.limitAmount,
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new HttpException(
          'A budget already exists for this category and month',
          409,
        );
      }
      throw error;
    }
  }

  async findBudgets(userId: string, month?: string) {
    const range = this.monthRange(month);
    const [budgets, spentGroups] = await Promise.all([
      this.prisma.personalBudget.findMany({
        where: { user_id: userId, month: range.start },
        orderBy: { category: 'asc' },
      }),
      this.prisma.personalTransaction.groupBy({
        by: ['category'],
        where: {
          user_id: userId,
          type: PersonalTransactionType.EXPENSE,
          date: { gte: range.start, lt: range.end },
        },
        _sum: { amount: true },
      }),
    ]);
    const spentByCategory = new Map(
      spentGroups.map((group) => [
        group.category,
        Number(group._sum.amount ?? 0),
      ]),
    );

    return budgets.map((budget) => {
      const limitAmount = Number(budget.limit_amount);
      const spentAmount = spentByCategory.get(budget.category) ?? 0;
      return {
        ...budget,
        spentAmount: Number(spentAmount.toFixed(2)),
        remainingAmount: Number((limitAmount - spentAmount).toFixed(2)),
        progressPercent:
          limitAmount > 0
            ? Number(
                Math.min((spentAmount / limitAmount) * 100, 100).toFixed(2),
              )
            : 0,
        isExceeded: spentAmount > limitAmount,
      };
    });
  }

  async updateBudget(userId: string, id: string, dto: UpdatePersonalBudgetDto) {
    const existing = await this.prisma.personalBudget.findFirst({
      where: { id, user_id: userId },
      select: { id: true },
    });
    if (!existing) throw new HttpException('Personal budget not found', 404);
    return this.prisma.personalBudget.update({
      where: { id },
      data: { limit_amount: dto.limitAmount },
    });
  }

  async removeBudget(userId: string, id: string) {
    const removed = await this.prisma.personalBudget.deleteMany({
      where: { id, user_id: userId },
    });
    if (!removed.count)
      throw new HttpException('Personal budget not found', 404);
    return { message: 'Personal budget deleted successfully' };
  }
}
