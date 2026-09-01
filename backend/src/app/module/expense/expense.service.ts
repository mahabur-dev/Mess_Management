import { HttpException, Injectable } from '@nestjs/common';
import {
  DepositLedgerType,
  ExpenseCategory,
  ExpensePaymentType,
  ExpenseRecordType,
  ExpenseSplitMethod,
  ExpenseStatus,
  ExpenseUsedBy,
  LedgerDirection,
  NotificationType,
  Prisma,
  UtilityType,
} from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { buildDeterministicOrder } from 'src/app/helpers/deterministic-order';
import { PrismaService } from 'src/prisma/prisma.service';
import config from 'src/app/config';
import { MonthlyBillReconciliationService } from '../monthly-bill/monthly-bill-reconciliation.service';
import { allocateAmountByWeight } from '../monthly-bill/billing-calculator';
import { NotificationService } from '../notification/notification.service';
import {
  FundLedgerService,
  type FundLedgerClient,
} from '../fund-ledger/fund-ledger.service';
import {
  type CloudinaryResourceType,
  deleteFromCloudinary,
  uploadToCloudinary,
} from 'src/app/helpers/fileUploder';
import {
  CreateExpenseDto,
  ExpenseFilterDto,
  ExpensePreviewDto,
  RequestPriceReviewDto,
  ReviewExpenseDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import {
  calculateSplit,
  ExpenseCalculationError,
  roundMoney,
  type CalculatedShare,
  type SplitMember,
} from './expense-calculator';
import { isUtilitySplitAllowed } from './expense-accounting';
import {
  canEditExpense,
  requiresExpenseApproval,
  statusForExpenseWrite,
  toApprovalStatus,
} from './expense-approval.policy';
import {
  assertExpenseItemsTotal,
  calculateExpenseItemsTotal,
} from './expense-item-calculator';

type AuthRole = string;
type NormalizedPaidFrom = ExpensePaymentType;

export type PreparedExpenseItem = {
  itemName: string;
  quantity: number | null;
  unit: string | null;
  amount: number;
  sortOrder: number;
};

export type PreparedExpense = {
  messId: string;
  type: ExpenseRecordType;
  category: ExpenseCategory;
  utilityType?: UtilityType | null;
  amount: number;
  paidFrom: NormalizedPaidFrom;
  usedBy: ExpenseUsedBy;
  splitMethod: ExpenseSplitMethod;
  purchasedByMemberId: string;
  addedByUserId: string;
  expenseDate: Date;
  billingMonth: Date;
  items: PreparedExpenseItem[];
  description: string | null;
  receiptUrl: string | null;
  receiptPublicId: string | null;
  receiptResourceType: CloudinaryResourceType | null;
  affectedMembers: SplitMember[];
  shares: CalculatedShare[];
  payerCredit: number;
  totalSharedCost: number;
  requiresApproval: boolean;
};

const utilityCategoryMap: Partial<Record<ExpenseCategory, UtilityType>> = {
  [ExpenseCategory.ELECTRICITY]: UtilityType.ELECTRICITY,
  [ExpenseCategory.GAS]: UtilityType.GAS,
  [ExpenseCategory.WATER]: UtilityType.WATER,
  [ExpenseCategory.WIFI]: UtilityType.WIFI,
  [ExpenseCategory.CLEANER]: UtilityType.CLEANING,
};

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billReconciliation: MonthlyBillReconciliationService,
    private readonly notificationService: NotificationService,
    private readonly fundLedgerService: FundLedgerService,
  ) {}

  private expenseOrderBy(
    sort: Pick<ExpenseFilterDto, 'sortBy' | 'sortOrder'> = {},
  ): Prisma.ExpenseOrderByWithRelationInput[] {
    return buildDeterministicOrder({
      requestedField: sort.sortBy,
      requestedDirection: sort.sortOrder,
      aliases: { date: 'expense_date' },
      allowedFields: ['expense_date', 'created_at', 'amount'],
      businessDateField: 'expense_date',
    }) as Prisma.ExpenseOrderByWithRelationInput[];
  }

  private readonly expenseSelect = {
    id: true,
    type: true,
    category: true,
    utility_type: true,
    amount: true,
    description: true,
    receipt_url: true,
    buyer_id: true,
    purchased_by: true,
    items: {
      orderBy: { sort_order: 'asc' as const },
      select: {
        id: true,
        item_name: true,
        quantity: true,
        unit: true,
        amount: true,
        sort_order: true,
      },
    },
    expense_date: true,
    billing_month: true,
    payment_type: true,
    used_by: true,
    split_method: true,
    status: true,
    reviewed_by: true,
    reviewed_at: true,
    review_note: true,
    created_at: true,
    updated_at: true,
    mess: { select: { id: true, name: true } },
    creator: { select: { id: true, name: true, email: true } },
    purchaser: { select: { id: true, name: true, email: true } },
    shares: {
      orderBy: { created_at: 'asc' as const },
      select: {
        id: true,
        member_id: true,
        member_name: true,
        meal_count: true,
        share_amount: true,
        is_payer: true,
        member: { select: { id: true, name: true, email: true } },
      },
    },
    ledger_entries: {
      select: {
        id: true,
        member_id: true,
        type: true,
        direction: true,
        amount: true,
        note: true,
        created_at: true,
      },
    },
  } as const;

  private monthStart(input: string | Date) {
    const date = new Date(input);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  private monthRange(input: string | Date) {
    const start = this.monthStart(input);
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
    );
    return { start, end };
  }

  private normalizePaidFrom(
    dto: Pick<CreateExpenseDto | UpdateExpenseDto, 'paidFrom' | 'paymentType'>,
  ) {
    const value = String(
      dto.paidFrom ?? dto.paymentType ?? ExpensePaymentType.FROM_DEPOSIT,
    ).toUpperCase();
    if (value === 'MESS_DEPOSIT') return ExpensePaymentType.FROM_DEPOSIT;
    if (
      Object.values(ExpensePaymentType).includes(value as ExpensePaymentType)
    ) {
      return value as ExpensePaymentType;
    }
    throw new HttpException('Invalid paid from value', 400);
  }

  private normalizeIdList(value?: string[] | string | null) {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : String(value).split(',');
    const ids = raw.map((id) => id.trim()).filter(Boolean);
    return [...new Set(ids)];
  }

  private normalizeCustomShares(value: unknown) {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value) as Array<{
          memberId: string;
          amount: number;
        }>;
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        throw new HttpException('Invalid custom share payload', 400);
      }
    }
    return Array.isArray(value)
      ? (value as Array<{ memberId: string; amount: number }>)
      : [];
  }

  private hasOwn<T extends object>(value: T, key: PropertyKey) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  private normalizeOptionalText(value: string | null | undefined) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private defaultItemName(category: ExpenseCategory) {
    return category
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private expenseItemsTitle(
    items: Array<{ itemName: string }>,
    fallback: string,
  ) {
    const firstItem = items[0];
    if (!firstItem) return fallback;
    return items.length > 1
      ? `${firstItem.itemName} + ${items.length - 1} more`
      : firstItem.itemName;
  }

  private normalizeExpenseItem(
    item: {
      itemName: string;
      amount: number;
      quantity?: number | null;
      unit?: string | null;
    },
    sortOrder: number,
  ): PreparedExpenseItem {
    const itemName = item.itemName?.trim();
    const amount = Number(item.amount);
    const quantity = item.quantity == null ? null : Number(item.quantity);

    if (!itemName) {
      throw new HttpException('Every expense item requires a name', 400);
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpException('Every expense item amount must be greater than zero', 400);
    }
    if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) {
      throw new HttpException('Expense item quantity cannot be negative', 400);
    }

    return {
      itemName,
      quantity,
      unit: this.normalizeOptionalText(item.unit),
      amount: roundMoney(amount),
      sortOrder,
    };
  }

  private prepareExpenseItems(
    dto: CreateExpenseDto | UpdateExpenseDto,
    category: ExpenseCategory,
    existingItems: Array<{
      item_name: string;
      quantity: Prisma.Decimal | null;
      unit: string | null;
      amount: Prisma.Decimal;
      sort_order: number;
    }> = [],
  ) {
    let items: PreparedExpenseItem[];

    if (dto.items !== undefined) {
      if (!dto.items.length) {
        throw new HttpException('At least one expense item is required', 400);
      }
      items = dto.items.map((item, index) =>
        this.normalizeExpenseItem(item, index),
      );
    } else {
      const changesLegacyItem =
        this.hasOwn(dto, 'amount') ||
        this.hasOwn(dto, 'itemName') ||
        this.hasOwn(dto, 'quantity') ||
        this.hasOwn(dto, 'unit');

      if (existingItems.length && !changesLegacyItem) {
        items = existingItems.map((item, index) =>
          this.normalizeExpenseItem(
            {
              itemName: item.item_name,
              amount: Number(item.amount),
              quantity: item.quantity == null ? null : Number(item.quantity),
              unit: item.unit,
            },
            index,
          ),
        );
      } else {
        if (existingItems.length > 1) {
          throw new HttpException(
            'Updating a multi-item expense requires the complete items array',
            400,
          );
        }

        const existingItem = existingItems[0];
        const amount = dto.amount ??
          (existingItem ? Number(existingItem.amount) : undefined);
        if (amount === undefined) {
          throw new HttpException('Expense items are required', 400);
        }

        items = [
          this.normalizeExpenseItem(
            {
              itemName:
                (this.hasOwn(dto, 'itemName')
                  ? this.normalizeOptionalText(dto.itemName)
                  : existingItem?.item_name) ?? this.defaultItemName(category),
              amount,
              quantity: this.hasOwn(dto, 'quantity')
                ? dto.quantity
                : existingItem?.quantity == null
                  ? null
                  : Number(existingItem.quantity),
              unit: this.hasOwn(dto, 'unit') ? dto.unit : existingItem?.unit,
            },
            0,
          ),
        ];
      }
    }

    const amount = calculateExpenseItemsTotal(items);
    if (dto.items !== undefined && dto.amount !== undefined) {
      try {
        assertExpenseItemsTotal(items, dto.amount);
      } catch (error) {
        if (error instanceof ExpenseCalculationError) {
          throw new HttpException(error.message, 400);
        }
        throw error;
      }
    }

    return { items, amount };
  }

  private getExpenseDate(
    dto: Pick<CreateExpenseDto | UpdateExpenseDto, 'expenseDate'>,
    fallback?: Date,
  ) {
    if (dto.expenseDate) return new Date(dto.expenseDate);
    if (fallback) return fallback;
    return new Date();
  }

  private inferRecordType(
    category: ExpenseCategory,
    explicit?: ExpenseRecordType,
  ) {
    if (explicit) return explicit;
    const utilityCategories = new Set<ExpenseCategory>([
      ExpenseCategory.UTILITY,
      ExpenseCategory.ELECTRICITY,
      ExpenseCategory.GAS,
      ExpenseCategory.WIFI,
      ExpenseCategory.CLEANER,
      ExpenseCategory.MAINTENANCE,
      ExpenseCategory.BUABILL,
      ExpenseCategory.WATER,
    ]);
    return utilityCategories.has(category)
      ? ExpenseRecordType.UTILITY
      : ExpenseRecordType.EXPENSE;
  }

  private inferUtilityType(
    category: ExpenseCategory,
    explicit?: UtilityType | null,
  ) {
    if (explicit) return explicit;
    return (
      utilityCategoryMap[category] ??
      (category === ExpenseCategory.UTILITY ? UtilityType.OTHER : null)
    );
  }

  private async hasManagerAccess(
    messId: string,
    userId: string,
    role: AuthRole,
  ): Promise<boolean> {
    if (role === 'ADMIN') return true;

    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return true;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    return Boolean(membership?.is_active && membership.role === 'MANAGER');
  }

  private async verifyManagerAccess(
    messId: string,
    userId: string,
    role: AuthRole,
  ): Promise<void> {
    if (await this.hasManagerAccess(messId, userId, role)) return;

    throw new HttpException(
      'Forbidden: Only managers can manage shared expenses',
      403,
    );
  }

  private async verifyMessMemberAccess(
    messId: string,
    userId: string,
    role: AuthRole,
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

  private async ensureActiveSubscription(messId: string, role: AuthRole) {
    if (!config.features.subscriptionEnabled || role === 'ADMIN') return;

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

  private async getActiveMembers(messId: string) {
    const memberships = await this.prisma.messMembership.findMany({
      where: { mess_id: messId, is_active: true },
      orderBy: { joined_at: 'asc' },
      select: {
        user_id: true,
        user: {
          select: { id: true, name: true, email: true, is_active: true },
        },
      },
    });

    return memberships
      .filter((membership) => membership.user.is_active)
      .map((membership) => ({
        id: membership.user_id,
        name: membership.user.name,
      }));
  }

  private async getMealCounts(
    messId: string,
    memberIds: string[],
    month: Date,
  ) {
    if (!memberIds.length) return new Map<string, number>();
    const { start, end } = this.monthRange(month);

    const attendances = await this.prisma.mealAttendance.findMany({
      where: {
        member_id: { in: memberIds },
        status: 'ON',
        meal: {
          mess_id: messId,
          scheduled_date: { gte: start, lt: end },
          status: { not: 'CANCELLED' },
        },
      },
      select: {
        member_id: true,
        guests: true,
        meal: { select: { name: true } },
      },
    });

    const baseValueByMeal = { BREAKFAST: 0.5, LUNCH: 1, DINNER: 1 } as Record<
      string,
      number
    >;
    const counts = new Map<string, number>();
    for (const attendance of attendances) {
      const value =
        (baseValueByMeal[attendance.meal.name] ?? 1) +
        Number(attendance.guests ?? 0);
      counts.set(
        attendance.member_id,
        roundMoney((counts.get(attendance.member_id) ?? 0) + value),
      );
    }
    return counts;
  }

  private async getMealOnMemberIds(messId: string, expenseDate: Date) {
    const dayStart = new Date(
      Date.UTC(
        expenseDate.getUTCFullYear(),
        expenseDate.getUTCMonth(),
        expenseDate.getUTCDate(),
      ),
    );
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const attendances = await this.prisma.mealAttendance.findMany({
      where: {
        status: 'ON',
        meal: {
          mess_id: messId,
          scheduled_date: { gte: dayStart, lt: dayEnd },
          status: { not: 'CANCELLED' },
        },
      },
      select: {
        member_id: true,
      },
    });

    return [...new Set(attendances.map((attendance) => attendance.member_id))];
  }

  private async resolveAffectedMembers(params: {
    messId: string;
    usedBy: ExpenseUsedBy;
    purchasedByMemberId: string;
    selectedMemberIds: string[];
    expenseDate: Date;
    billingMonth: Date;
    splitMethod: ExpenseSplitMethod;
  }): Promise<SplitMember[]> {
    const {
      messId,
      usedBy,
      purchasedByMemberId,
      selectedMemberIds,
      expenseDate,
      billingMonth,
      splitMethod,
    } = params;
    let memberIds: string[];
    const activeMembers = await this.getActiveMembers(messId);

    if (usedBy === ExpenseUsedBy.SELECTED_MEMBERS) {
      if (!selectedMemberIds.length) {
        throw new HttpException('Selected members are required', 400);
      }
      memberIds = selectedMemberIds;
    } else if (usedBy === ExpenseUsedBy.MEAL_ON_MEMBERS) {
      memberIds = await this.getMealOnMemberIds(messId, expenseDate);
      if (!memberIds.length) {
        throw new HttpException(
          'No meal-on members found for the expense date',
          400,
        );
      }
    } else {
      memberIds = activeMembers.map((member) => member.id);
    }

    memberIds = [...new Set(memberIds)];

    const activeById = new Map(
      activeMembers.map((member) => [member.id, member]),
    );
    const invalidId = memberIds.find((id) => !activeById.has(id));
    if (invalidId) {
      throw new HttpException(
        'Selected members must be active members of this mess',
        400,
      );
    }

    const mealCounts =
      splitMethod === ExpenseSplitMethod.MEAL_COUNT
        ? await this.getMealCounts(messId, memberIds, billingMonth)
        : new Map<string, number>();

    return memberIds.map((id) => ({
      id,
      name: activeById.get(id)?.name,
      mealCount: mealCounts.get(id) ?? 0,
    }));
  }

  private async prepareExpense(
    userId: string,
    role: AuthRole,
    dto: CreateExpenseDto | UpdateExpenseDto,
    existing?: {
      mess_id: string;
      category: ExpenseCategory;
      type: ExpenseRecordType;
      utility_type: UtilityType | null;
      amount: Prisma.Decimal;
      payment_type: ExpensePaymentType;
      used_by: ExpenseUsedBy;
      split_method: ExpenseSplitMethod;
      purchased_by: string | null;
      created_by: string;
      expense_date: Date;
      billing_month: Date | null;
      items: Array<{
        item_name: string;
        quantity: Prisma.Decimal | null;
        unit: string | null;
        amount: Prisma.Decimal;
        sort_order: number;
      }>;
      description: string | null;
      receipt_url: string | null;
      receipt_public_id: string | null;
      receipt_resource_type: string | null;
      shares?: Array<{
        member_id: string;
        share_amount: Prisma.Decimal;
      }>;
    },
    uploadedReceipt?: {
      url: string;
      publicId: string;
      resourceType: CloudinaryResourceType;
    },
  ): Promise<PreparedExpense> {
    const messId =
      'messId' in dto && dto.messId ? dto.messId : existing?.mess_id;
    if (!messId) throw new HttpException('Mess ID is required', 400);

    await this.verifyMessMemberAccess(messId, userId, role);
    const [, canManage] = await Promise.all([
      this.ensureActiveSubscription(messId, role),
      this.hasManagerAccess(messId, userId, role),
    ]);

    const category =
      dto.category ?? existing?.category ?? ExpenseCategory.OTHER;
    const { items, amount } = this.prepareExpenseItems(
      dto,
      category,
      existing?.items,
    );
    const categoryChanged =
      dto.category !== undefined && dto.category !== existing?.category;
    const type = this.inferRecordType(
      category,
      dto.type ?? (categoryChanged ? undefined : existing?.type),
    );
    const utilityType = this.inferUtilityType(
      category,
      dto.utilityType ?? (categoryChanged ? undefined : existing?.utility_type),
    );
    let paidFrom = this.normalizePaidFrom({
      paidFrom: dto.paidFrom ?? undefined,
      paymentType: dto.paymentType ?? existing?.payment_type,
    });
    let usedBy = dto.usedBy ?? existing?.used_by ?? ExpenseUsedBy.ALL_MEMBERS;
    let splitMethod =
      dto.splitMethod ??
      existing?.split_method ??
      (category === ExpenseCategory.FOOD || category === ExpenseCategory.GROCERY
        ? ExpenseSplitMethod.MEAL_COUNT
        : ExpenseSplitMethod.EQUAL);

    if (usedBy === ExpenseUsedBy.SELF_ONLY) {
      throw new HttpException(
        'Self-only expenses are no longer supported; use Personal Finance instead',
        400,
      );
    }

    if (
      type === ExpenseRecordType.UTILITY &&
      !isUtilitySplitAllowed(usedBy, splitMethod)
    ) {
      throw new HttpException(
        'Utility expenses support All Members or Specific Members with Equal or Manual Split',
        400,
      );
    }
    const expenseDate = this.getExpenseDate(dto, existing?.expense_date);
    const billingMonth = this.monthStart(
      dto.billingMonth ?? existing?.billing_month ?? expenseDate,
    );
    let purchasedByMemberId =
      dto.purchasedBy?.trim() ||
      existing?.purchased_by ||
      existing?.created_by ||
      userId;

    if (!canManage) {
      purchasedByMemberId = userId;
    }
    if (purchasedByMemberId !== userId || role === 'ADMIN') {
      await this.ensureActiveMessMember(messId, purchasedByMemberId);
    }

    const selectedMemberIds =
      dto.selectedMemberIds !== undefined
        ? this.normalizeIdList(
            dto.selectedMemberIds as string[] | string | undefined,
          )
        : [...new Set(existing?.shares?.map((share) => share.member_id) ?? [])];
    const affectedMembers = await this.resolveAffectedMembers({
      messId,
      usedBy,
      purchasedByMemberId,
      selectedMemberIds,
      expenseDate,
      billingMonth,
      splitMethod,
    });

    const customShares =
      dto.customShares !== undefined
        ? this.normalizeCustomShares(dto.customShares)
        : splitMethod === ExpenseSplitMethod.CUSTOM
          ? (existing?.shares ?? []).map((share) => ({
              memberId: share.member_id,
              amount: Number(share.share_amount),
            }))
          : [];

    let impact;
    try {
      impact = calculateSplit({
        amount,
        paidFrom,
        usedBy,
        splitMethod,
        members: affectedMembers,
        customShares,
      });
    } catch (error) {
      if (error instanceof ExpenseCalculationError) {
        throw new HttpException(error.message, 400);
      }
      throw error;
    }

    return {
      messId,
      type,
      category,
      utilityType,
      amount: roundMoney(amount),
      paidFrom,
      usedBy,
      splitMethod,
      purchasedByMemberId,
      addedByUserId: existing?.created_by ?? userId,
      expenseDate,
      billingMonth,
      items,
      description: this.hasOwn(dto, 'description')
        ? this.normalizeOptionalText(dto.description)
        : (existing?.description ?? null),
      receiptUrl: uploadedReceipt
        ? uploadedReceipt.url
        : this.hasOwn(dto, 'receiptUrl')
          ? (dto.receiptUrl ?? null)
          : (existing?.receipt_url ?? null),
      receiptPublicId: uploadedReceipt
        ? uploadedReceipt.publicId
        : this.hasOwn(dto, 'receiptUrl')
          ? null
          : (existing?.receipt_public_id ?? null),
      receiptResourceType: uploadedReceipt
        ? uploadedReceipt.resourceType
        : this.hasOwn(dto, 'receiptUrl')
          ? null
          : ((existing?.receipt_resource_type as CloudinaryResourceType | null) ??
            null),
      affectedMembers,
      shares: impact.shares,
      payerCredit: impact.payerCredit,
      totalSharedCost: impact.totalSharedCost,
      requiresApproval: requiresExpenseApproval({
        canManage,
      }),
    };
  }

  private previewResponse(prepared: PreparedExpense) {
    const title = this.expenseItemsTitle(
      prepared.items,
      prepared.utilityType || prepared.category,
    );
    const itemTotal = roundMoney(
      prepared.items.reduce((sum, item) => sum + item.amount, 0),
    );

    return {
      title,
      amount: prepared.amount,
      items: prepared.items,
      type: prepared.type,
      category: prepared.category,
      utilityType: prepared.utilityType,
      paidFrom:
        prepared.paidFrom === ExpensePaymentType.FROM_DEPOSIT
          ? 'MESS_DEPOSIT'
          : prepared.paidFrom,
      paymentType: prepared.paidFrom,
      usedBy: prepared.usedBy,
      splitMethod: prepared.splitMethod,
      purchasedByMemberId: prepared.purchasedByMemberId,
      affectedMemberCount: prepared.affectedMembers.length,
      payerCredit: prepared.payerCredit,
      totalSharedCost: prepared.totalSharedCost,
      shares: prepared.shares,
      validation: {
        isValid:
          itemTotal === roundMoney(prepared.amount) &&
          roundMoney(prepared.totalSharedCost) === roundMoney(prepared.amount),
        message: 'Split preview calculated successfully',
      },
    };
  }

  /** Keeps deposit-funded expense validation identical for preview, submit and edit. */
  private async assertPreparedFundBalance(
    client: FundLedgerClient,
    prepared: Pick<PreparedExpense, 'messId' | 'paidFrom' | 'amount'>,
  ) {
    await this.fundLedgerService.assertSufficientBalance(
      client,
      prepared.messId,
      prepared.paidFrom,
      prepared.amount,
    );
  }

  private approvalStatus(status: string) {
    return toApprovalStatus(status as 'DRAFT' | 'CONFIRMED' | 'CANCELLED');
  }

  private mapExpense(expense: any) {
    const amount = Number(expense.amount ?? 0);
    const items = (expense.items ?? []).map((item: any) => ({
      id: item.id,
      itemName: item.item_name,
      quantity: item.quantity == null ? null : Number(item.quantity),
      unit: item.unit,
      amount: Number(item.amount ?? 0),
      sortOrder: item.sort_order,
    }));
    const firstItem = items[0];
    const itemName = this.expenseItemsTitle(
      items,
      this.defaultItemName(expense.category),
    );
    const shares = (expense.shares ?? []).map((share: any) => ({
      id: share.id,
      memberId: share.member_id,
      memberName: share.member_name ?? share.member?.name,
      mealCount: share.meal_count == null ? null : Number(share.meal_count),
      shareAmount: Number(share.share_amount ?? 0),
      isPayer: Boolean(share.is_payer),
      member: share.member,
    }));
    const payerCredit = (expense.ledger_entries ?? [])
      .filter(
        (entry: any) =>
          entry.type === DepositLedgerType.PERSONAL_EXPENSE_CREDIT,
      )
      .reduce((sum: number, entry: any) => sum + Number(entry.amount ?? 0), 0);
    const sharedCost = shares.reduce(
      (sum: number, share: any) => sum + share.shareAmount,
      0,
    );

    return {
      ...expense,
      messId: expense.mess?.id,
      type: expense.type,
      category: expense.category,
      utilityType: expense.utility_type,
      amount,
      description: expense.description,
      receiptUrl: expense.receipt_url,
      buyerId: expense.buyer_id,
      purchasedBy: expense.purchased_by,
      itemName,
      quantity: items.length === 1 ? firstItem.quantity : null,
      unit: items.length === 1 ? firstItem.unit : null,
      items,
      item_name: itemName,
      expenseDate: expense.expense_date,
      billingMonth: expense.billing_month,
      paymentType: expense.payment_type,
      paidFrom:
        expense.payment_type === ExpensePaymentType.FROM_DEPOSIT
          ? 'MESS_DEPOSIT'
          : expense.payment_type,
      usedBy: expense.used_by,
      splitMethod: expense.split_method,
      status: expense.status,
      approvalStatus: this.approvalStatus(expense.status),
      reviewedBy: expense.reviewed_by,
      reviewedAt: expense.reviewed_at,
      reviewNote: expense.review_note,
      createdAt: expense.created_at,
      updatedAt: expense.updated_at,
      creator: expense.creator,
      createdById: expense.creator?.id,
      purchaser: expense.purchaser,
      purchased_by: expense.purchaser,
      created_by: expense.creator,
      shares,
      impactSummary: {
        payerCredit: roundMoney(Number(payerCredit)),
        sharedCost: roundMoney(Number(sharedCost)),
        includedInMonthlyBill:
          expense.payment_type !== ExpensePaymentType.COLLECTED_FUND,
      },
    };
  }

  async preview(userId: string, role: AuthRole, dto: ExpensePreviewDto) {
    const prepared = await this.prepareExpense(userId, role, dto);
    await this.assertPreparedFundBalance(this.prisma, prepared);
    return this.previewResponse(prepared);
  }

  /** Shared validation/calculation boundary used by manual and AI workflows. */
  async prepareCreate(
    userId: string,
    role: AuthRole,
    dto: CreateExpenseDto,
  ): Promise<PreparedExpense> {
    return this.prepareExpense(userId, role, dto);
  }

  /** Shared write boundary. The caller owns the transaction. */
  async persistCreate(
    tx: Prisma.TransactionClient,
    userId: string,
    dto: CreateExpenseDto,
    prepared: PreparedExpense,
  ) {
    await this.assertPreparedFundBalance(tx, prepared);

    const created = await tx.expense.create({
      data: {
        mess_id: prepared.messId,
        created_by: prepared.addedByUserId,
        purchased_by: prepared.purchasedByMemberId,
        type: prepared.type,
        category: prepared.category,
        utility_type: prepared.utilityType,
        amount: prepared.amount,
        expense_date: prepared.expenseDate,
        billing_month: prepared.billingMonth,
        description: prepared.description,
        receipt_url: prepared.receiptUrl,
        receipt_public_id: prepared.receiptPublicId,
        receipt_resource_type: prepared.receiptResourceType,
        buyer_id: dto.buyerId,
        payment_type: prepared.paidFrom,
        used_by: prepared.usedBy,
        split_method: prepared.splitMethod,
        status: statusForExpenseWrite(!prepared.requiresApproval),
        reviewed_by: prepared.requiresApproval ? null : userId,
        reviewed_at: prepared.requiresApproval ? null : new Date(),
        review_note: null,
      },
    });

    await tx.expenseItem.createMany({
      data: prepared.items.map((item) => ({
        expense_id: created.id,
        item_name: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        amount: item.amount,
        sort_order: item.sortOrder,
      })),
    });

    if (prepared.shares.length) {
      await tx.expenseShare.createMany({
        data: prepared.shares.map((share) => ({
          expense_id: created.id,
          member_id: share.memberId,
          member_name: share.memberName,
          meal_count: share.mealCount,
          share_amount: share.shareAmount,
          is_payer: share.memberId === prepared.purchasedByMemberId,
        })),
      });
    }

    if (!prepared.requiresApproval) {
      const ledgers = this.buildLedgerRows(created.id, prepared);
      if (ledgers.length) await tx.depositLedger.createMany({ data: ledgers });
    }

    return tx.expense.findUniqueOrThrow({
      where: { id: created.id },
      select: this.expenseSelect,
    });
  }

  /** Post-commit effects shared by manual and AI creation. */
  async completeCreate(userId: string, prepared: PreparedExpense, expense: any) {
    const billingSync = prepared.requiresApproval
      ? null
      : await this.billReconciliation.reconcile(
          prepared.messId,
          prepared.billingMonth,
        );
    await this.sendExpenseNotification(userId, prepared, expense.id);
    return { ...this.mapExpense(expense), billingSync };
  }

  private async runSerializableTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 20_000,
        });
      } catch (error) {
        const isWriteConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';
        if (!isWriteConflict || attempt === maxAttempts) throw error;
      }
    }
    throw new Error('Serializable transaction retry limit exceeded');
  }

  async create(
    userId: string,
    role: AuthRole,
    dto: CreateExpenseDto,
    receipt?: Express.Multer.File,
  ) {
    const uploaded = receipt
      ? await uploadToCloudinary(receipt, 'mess_management/expenses', {
          allowedTypes: ['image', 'pdf'],
          maxSizeBytes: 10 * 1024 * 1024,
        })
      : null;

    try {
      const prepared = await this.prepareExpense(
        userId,
        role,
        dto,
        undefined,
        uploaded
          ? {
              url: uploaded.url,
              publicId: uploaded.public_id,
              resourceType: uploaded.resource_type,
            }
          : undefined,
      );

      const expense = await this.runSerializableTransaction((tx) =>
        this.persistCreate(tx, userId, dto, prepared),
      );

      return this.completeCreate(userId, prepared, expense);
    } catch (error) {
      if (uploaded) {
        await deleteFromCloudinary(uploaded.public_id, uploaded.resource_type);
      }
      throw error;
    }
  }

  private buildLedgerRows(
    expenseId: string,
    prepared: PreparedExpense,
  ): Prisma.DepositLedgerCreateManyInput[] {
    if (
      prepared.paidFrom === ExpensePaymentType.PERSONAL &&
      prepared.payerCredit > 0
    ) {
      return [
        {
          mess_id: prepared.messId,
          member_id: prepared.purchasedByMemberId,
          expense_id: expenseId,
          type: DepositLedgerType.PERSONAL_EXPENSE_CREDIT,
          direction: LedgerDirection.CREDIT,
          amount: prepared.payerCredit,
          effective_date: prepared.billingMonth,
          note: 'Personal expense credit',
        },
      ];
    }

    if (prepared.paidFrom === ExpensePaymentType.FROM_DEPOSIT) {
      return [
        {
          mess_id: prepared.messId,
          expense_id: expenseId,
          type: DepositLedgerType.MESS_EXPENSE_DEBIT,
          direction: LedgerDirection.DEBIT,
          amount: prepared.amount,
          effective_date: prepared.billingMonth,
          note: 'Mess deposit funded expense',
        },
      ];
    }

    if (prepared.paidFrom === ExpensePaymentType.COLLECTED_FUND) {
      return [
        {
          mess_id: prepared.messId,
          expense_id: expenseId,
          type: DepositLedgerType.COLLECTED_FUND_OUT,
          direction: LedgerDirection.DEBIT,
          amount: prepared.amount,
          effective_date: prepared.billingMonth,
          note: 'Collected fund expense',
        },
      ];
    }

    return [];
  }

  private buildStoredExpenseLedgerRows(expense: {
    id: string;
    mess_id?: string;
    mess: { id: string };
    purchased_by: string | null;
    creator: { id: string };
    amount: Prisma.Decimal;
    payment_type: ExpensePaymentType;
    used_by: ExpenseUsedBy;
    billing_month: Date | null;
    expense_date: Date;
  }): Prisma.DepositLedgerCreateManyInput[] {
    const effectiveDate = expense.billing_month ?? expense.expense_date;

    if (
      expense.payment_type === ExpensePaymentType.PERSONAL &&
      expense.used_by !== ExpenseUsedBy.SELF_ONLY
    ) {
      return [
        {
          mess_id: expense.mess.id,
          member_id: expense.purchased_by ?? expense.creator.id,
          expense_id: expense.id,
          type: DepositLedgerType.PERSONAL_EXPENSE_CREDIT,
          direction: LedgerDirection.CREDIT,
          amount: expense.amount,
          effective_date: effectiveDate,
          note: 'Personal expense credit',
        },
      ];
    }

    if (expense.payment_type === ExpensePaymentType.FROM_DEPOSIT) {
      return [
        {
          mess_id: expense.mess.id,
          expense_id: expense.id,
          type: DepositLedgerType.MESS_EXPENSE_DEBIT,
          direction: LedgerDirection.DEBIT,
          amount: expense.amount,
          effective_date: effectiveDate,
          note: 'Mess deposit funded expense',
        },
      ];
    }

    if (expense.payment_type === ExpensePaymentType.COLLECTED_FUND) {
      return [
        {
          mess_id: expense.mess.id,
          expense_id: expense.id,
          type: DepositLedgerType.COLLECTED_FUND_OUT,
          direction: LedgerDirection.DEBIT,
          amount: expense.amount,
          effective_date: effectiveDate,
          note: 'Collected fund expense',
        },
      ];
    }

    return [];
  }

  private async sendExpenseNotification(
    userId: string,
    prepared: PreparedExpense,
    expenseId: string,
  ) {
    if (!prepared.requiresApproval) return;

    const managerUserIds =
      await this.notificationService.resolveMessManagerUserIds(prepared.messId);
    if (managerUserIds.length === 0) return;

    await this.notificationService
      .createForMess(
        userId,
        prepared.messId,
        NotificationType.EXPENSE_ADDED,
        prepared.requiresApproval
          ? `${prepared.type === ExpenseRecordType.UTILITY ? 'Utility' : 'Expense'} Submitted for Approval`
          : `New ${prepared.type === ExpenseRecordType.UTILITY ? 'Utility' : 'Expense'} Added`,
        `${this.expenseItemsTitle(prepared.items, prepared.category)} - ${prepared.amount} [${prepared.paidFrom}]`,
        {
          source: 'EXPENSE',
          expenseId,
          paymentType: prepared.paidFrom,
          usedBy: prepared.usedBy,
          splitMethod: prepared.splitMethod,
          approvalStatus: prepared.requiresApproval ? 'PENDING' : 'APPROVED',
        },
        managerUserIds,
        '/expenses',
        `expense-submitted-${expenseId}`,
      )
      .catch(() => undefined);
  }

  async findAll(query: ExpenseFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip } = paginationHelper(paginationOptions);
    const where = this.buildWhere(query);

    const [total, expenses, aggregate] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: this.expenseOrderBy(query),
        select: this.expenseSelect,
      }),
      this.prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
      data: expenses.map((expense) => this.mapExpense(expense)),
      meta: buildMeta(total, page, limit),
      totalAmount: aggregate._sum.amount ?? 0,
    };
  }

  async findByMess(
    messId: string,
    userId: string,
    role: AuthRole,
    query: ExpenseFilterDto,
  ) {
    await this.verifyMessMemberAccess(messId, userId, role);
    return this.findAll({ ...query, messId });
  }

  async findOne(id: string, userId: string, role: AuthRole) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      select: this.expenseSelect,
    });

    if (!expense) throw new HttpException('Expense not found', 404);
    await this.verifyMessMemberAccess(expense.mess.id, userId, role);

    return this.mapExpense(expense);
  }

  async update(
    id: string,
    userId: string,
    role: AuthRole,
    dto: UpdateExpenseDto,
    receipt?: Express.Multer.File,
  ) {
    const existing = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sort_order: 'asc' },
        },
        shares: {
          select: { member_id: true, share_amount: true },
        },
      },
    });
    if (!existing) throw new HttpException('Expense not found', 404);

    await this.verifyMessMemberAccess(existing.mess_id, userId, role);
    const canManage = await this.hasManagerAccess(
      existing.mess_id,
      userId,
      role,
    );
    if (!canEditExpense(canManage, userId, existing.created_by)) {
      throw new HttpException(
        'Forbidden: Members can edit only expenses they submitted',
        403,
      );
    }

    const uploaded = receipt
      ? await uploadToCloudinary(receipt, 'mess_management/expenses', {
          allowedTypes: ['image', 'pdf'],
          maxSizeBytes: 10 * 1024 * 1024,
        })
      : null;

    let prepared: PreparedExpense;
    try {
      prepared = await this.prepareExpense(
        userId,
        role,
        dto,
        existing,
        uploaded
          ? {
              url: uploaded.url,
              publicId: uploaded.public_id,
              resourceType: uploaded.resource_type,
            }
          : undefined,
      );
    } catch (error) {
      if (uploaded) {
        await deleteFromCloudinary(uploaded.public_id, uploaded.resource_type);
      }
      throw error;
    }
    const previousMonth = this.monthStart(
      existing.billing_month ?? existing.expense_date,
    );

    let updated;
    try {
      updated = await this.runSerializableTransaction(async (tx) => {
        await tx.depositLedger.deleteMany({ where: { expense_id: id } });
        await this.assertPreparedFundBalance(tx, prepared);
        await tx.expenseShare.deleteMany({ where: { expense_id: id } });
        await tx.expenseItem.deleteMany({ where: { expense_id: id } });

        await tx.expense.update({
          where: { id },
          data: {
            purchased_by: prepared.purchasedByMemberId,
            type: prepared.type,
            category: prepared.category,
            utility_type: prepared.utilityType,
            amount: prepared.amount,
            expense_date: prepared.expenseDate,
            billing_month: prepared.billingMonth,
            description: prepared.description,
            receipt_url: prepared.receiptUrl,
            receipt_public_id: prepared.receiptPublicId,
            receipt_resource_type: prepared.receiptResourceType,
            buyer_id: dto.buyerId ?? existing.buyer_id,
            payment_type: prepared.paidFrom,
            used_by: prepared.usedBy,
            split_method: prepared.splitMethod,
            status: statusForExpenseWrite(!prepared.requiresApproval),
            reviewed_by: prepared.requiresApproval ? null : userId,
            reviewed_at: prepared.requiresApproval ? null : new Date(),
            review_note: null,
          },
        });

        await tx.expenseItem.createMany({
          data: prepared.items.map((item) => ({
            expense_id: id,
            item_name: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            amount: item.amount,
            sort_order: item.sortOrder,
          })),
        });

        if (prepared.shares.length) {
          await tx.expenseShare.createMany({
            data: prepared.shares.map((share) => ({
              expense_id: id,
              member_id: share.memberId,
              member_name: share.memberName,
              meal_count: share.mealCount,
              share_amount: share.shareAmount,
              is_payer: share.memberId === prepared.purchasedByMemberId,
            })),
          });
        }

        if (!prepared.requiresApproval) {
          const ledgers = this.buildLedgerRows(id, prepared);
          if (ledgers.length) {
            await tx.depositLedger.createMany({ data: ledgers });
          }
        }

        return tx.expense.findUniqueOrThrow({
          where: { id },
          select: this.expenseSelect,
        });
      });
    } catch (error) {
      if (uploaded) {
        await deleteFromCloudinary(uploaded.public_id, uploaded.resource_type);
      }
      throw error;
    }

    if (
      existing.receipt_public_id &&
      existing.receipt_public_id !== prepared.receiptPublicId
    ) {
      await deleteFromCloudinary(
        existing.receipt_public_id,
        (existing.receipt_resource_type as CloudinaryResourceType | null) ??
          'image',
      );
    }

    const billingSync = await this.billReconciliation.reconcile(
      existing.mess_id,
      previousMonth,
      prepared.billingMonth,
    );

    return {
      ...this.mapExpense(updated),
      billingSync,
    };
  }

  async review(
    id: string,
    userId: string,
    role: AuthRole,
    dto: ReviewExpenseDto,
  ) {
    const existing = await this.prisma.expense.findUnique({
      where: { id },
      select: this.expenseSelect,
    });
    if (!existing) throw new HttpException('Expense not found', 404);

    await this.verifyManagerAccess(existing.mess.id, userId, role);
    if (existing.status !== 'DRAFT') {
      throw new HttpException(
        'Only pending expenses can be approved or rejected',
        409,
      );
    }

    const approving = dto.status === 'APPROVED';
    const nextStatus = approving ? 'CONFIRMED' : 'CANCELLED';
    const updated = await this.runSerializableTransaction(async (tx) => {
      await tx.depositLedger.deleteMany({ where: { expense_id: id } });
      if (approving) {
        await this.fundLedgerService.assertSufficientBalance(
          tx,
          existing.mess.id,
          existing.payment_type,
          Number(existing.amount),
        );
      }

      const reviewed = await tx.expense.update({
        where: { id },
        data: {
          status: nextStatus,
          reviewed_by: userId,
          reviewed_at: new Date(),
          review_note: this.normalizeOptionalText(dto.note),
        },
        select: this.expenseSelect,
      });

      if (approving) {
        const ledgers = this.buildStoredExpenseLedgerRows(existing);
        if (ledgers.length) await tx.depositLedger.createMany({ data: ledgers });
      }

      return reviewed;
    });

    const billingSync = await this.billReconciliation.reconcile(
      existing.mess.id,
      existing.billing_month ?? existing.expense_date,
    );

    await this.notificationService
      .sendPushToUser(existing.creator.id, {
        title: `Expense ${dto.status === 'APPROVED' ? 'approved' : 'rejected'}`,
        body: `${this.expenseItemsTitle(
          existing.items.map((item) => ({ itemName: item.item_name })),
          existing.category,
        )} was ${dto.status.toLowerCase()}.`,
        url: `/expense-details?expenseId=${encodeURIComponent(id)}&messId=${encodeURIComponent(existing.mess.id)}`,
        data: {
          type: 'EXPENSE_REVIEWED',
          expenseId: id,
          messId: existing.mess.id,
          approvalStatus: dto.status,
        },
      })
      .catch(() => undefined);

    return { ...this.mapExpense(updated), billingSync };
  }

  async remove(id: string, userId: string, role: AuthRole) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      select: {
        id: true,
        mess_id: true,
        expense_date: true,
        billing_month: true,
        receipt_public_id: true,
        receipt_resource_type: true,
      },
    });
    if (!expense) throw new HttpException('Expense not found', 404);

    await this.verifyManagerAccess(expense.mess_id, userId, role);
    const month = this.monthStart(
      expense.billing_month ?? expense.expense_date,
    );

    await this.runSerializableTransaction(async (tx) => {
      await tx.depositLedger.deleteMany({ where: { expense_id: id } });
      await tx.expense.delete({ where: { id } });
    });
    if (expense.receipt_public_id) {
      await deleteFromCloudinary(
        expense.receipt_public_id,
        (expense.receipt_resource_type as CloudinaryResourceType | null) ??
          'image',
      );
    }
    const billingSync = await this.billReconciliation.reconcile(
      expense.mess_id,
      month,
    );

    return { message: 'Expense deleted successfully', billingSync };
  }

  async requestPriceReview(
    id: string,
    userId: string,
    role: AuthRole,
    dto: RequestPriceReviewDto,
  ) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      select: {
        id: true,
        mess_id: true,
        items: {
          orderBy: { sort_order: 'asc' },
          select: { item_name: true },
        },
        category: true,
        amount: true,
        purchased_by: true,
        created_by: true,
        mess: { select: { id: true, name: true } },
      },
    });

    if (!expense) throw new HttpException('Expense not found', 404);
    await this.verifyManagerAccess(expense.mess_id, userId, role);

    return this.notificationService.sendPushToUser(
      expense.purchased_by ?? expense.created_by,
      {
        title: `Price review requested - ${expense.mess.name}`,
        body: dto.message.trim(),
        url: '/expenses',
        data: {
          messId: expense.mess.id,
          expenseId: expense.id,
          itemName: this.expenseItemsTitle(
            expense.items.map((item) => ({ itemName: item.item_name })),
            expense.category,
          ),
          amount: String(expense.amount),
          type: 'EXPENSE_PRICE_REVIEW',
        },
      },
    );
  }

  async getSummary(
    messId: string,
    userId: string,
    role: AuthRole,
    month: string,
  ) {
    await this.verifyMessMemberAccess(messId, userId, role);
    const { start } = this.monthRange(month);
    const isManager = role === 'ADMIN' || role === 'MANAGER';

    const shareWhere: Prisma.ExpenseShareWhereInput = {
      member_id: userId,
      expense: {
        mess_id: messId,
        status: 'CONFIRMED',
        billing_month: start,
        payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
        NOT: {
          payment_type: ExpensePaymentType.PERSONAL,
          used_by: ExpenseUsedBy.SELF_ONLY,
        },
      },
    };

    const [myShares, recent, allExpenses] = await Promise.all([
      this.prisma.expenseShare.findMany({
        where: shareWhere,
        include: { expense: true },
      }),
      this.prisma.expense.findMany({
        where: {
          mess_id: messId,
          ...(isManager
            ? {}
            : {
                OR: [
                  { purchased_by: userId },
                  { shares: { some: { member_id: userId } } },
                ],
              }),
          billing_month: start,
          status: 'CONFIRMED',
        },
        take: 4,
        orderBy: this.expenseOrderBy(),
        select: this.expenseSelect,
      }),
      isManager
        ? this.prisma.expense.aggregate({
            where: {
              mess_id: messId,
              billing_month: start,
              status: 'CONFIRMED',
            },
            _sum: { amount: true },
            _count: { _all: true },
          })
        : Promise.resolve(null),
    ]);

    const foodCategories = new Set<ExpenseCategory>([
      ExpenseCategory.FOOD,
      ExpenseCategory.GROCERY,
    ]);
    const utilityExclusions = new Set<ExpenseCategory>([
      ExpenseCategory.FOOD,
      ExpenseCategory.GROCERY,
      ExpenseCategory.RENT,
    ]);

    const foodBill = myShares
      .filter((share) => foodCategories.has(share.expense.category))
      .reduce((sum, share) => sum + Number(share.share_amount ?? 0), 0);
    const utilityBill = myShares
      .filter((share) => !utilityExclusions.has(share.expense.category))
      .reduce((sum, share) => sum + Number(share.share_amount ?? 0), 0);
    const roomRent = myShares
      .filter((share) => share.expense.category === ExpenseCategory.RENT)
      .reduce((sum, share) => sum + Number(share.share_amount ?? 0), 0);
    return {
      month: start,
      myView: {
        foodBill: roundMoney(foodBill),
        utilityBill: roundMoney(utilityBill),
        roomRent: roundMoney(roomRent),
        total: roundMoney(foodBill + utilityBill + roomRent),
        transactionCount: myShares.length,
      },
      managerView: isManager
        ? {
            totalExpenses: Number(allExpenses?._sum.amount ?? 0),
            transactionCount: allExpenses?._count._all ?? 0,
          }
        : null,
      recentExpenses: recent.map((expense) => this.mapExpense(expense)),
    };
  }

  async getMyDetails(
    messId: string,
    userId: string,
    role: AuthRole,
    month: string,
  ) {
    const summary = await this.getSummary(messId, userId, role, month);
    const { start } = this.monthRange(month);
    const [history, assignedFoodRecords] = await Promise.all([
      this.prisma.expense.findMany({
        where: {
          mess_id: messId,
          billing_month: start,
          status: 'CONFIRMED',
          OR: [
            { purchased_by: userId },
            { shares: { some: { member_id: userId } } },
          ],
        },
        take: 20,
        orderBy: this.expenseOrderBy(),
        select: this.expenseSelect,
      }),
      this.prisma.expense.findMany({
        where: {
          mess_id: messId,
          billing_month: start,
          status: ExpenseStatus.CONFIRMED,
          payment_type: { not: ExpensePaymentType.COLLECTED_FUND },
          category: {
            in: [ExpenseCategory.FOOD, ExpenseCategory.GROCERY],
          },
          shares: { some: { member_id: userId } },
          AND: [
            {
              NOT: {
                used_by: ExpenseUsedBy.ALL_MEMBERS,
                split_method: ExpenseSplitMethod.MEAL_COUNT,
              },
            },
            {
              NOT: {
                payment_type: ExpensePaymentType.PERSONAL,
                used_by: ExpenseUsedBy.SELF_ONLY,
              },
            },
          ],
        },
        orderBy: this.expenseOrderBy(),
        select: {
          id: true,
          category: true,
          amount: true,
          expense_date: true,
          description: true,
          used_by: true,
          split_method: true,
          items: {
            orderBy: { sort_order: 'asc' },
            select: { item_name: true },
          },
          shares: {
            orderBy: { created_at: 'asc' },
            select: {
              member_id: true,
              share_amount: true,
            },
          },
        },
      }),
    ]);

    const assignedMemberIds = [
      ...new Set(
        assignedFoodRecords.flatMap((expense) =>
          expense.shares.map((share) => share.member_id),
        ),
      ),
    ];
    const finalMealCounts = await this.getMealCounts(
      messId,
      assignedMemberIds,
      start,
    );

    const assignedFoodExpenses = assignedFoodRecords
      .map((expense) => {
        const storedShare = expense.shares.find(
          (share) => share.member_id === userId,
        );
        const memberShare =
          expense.split_method === ExpenseSplitMethod.MEAL_COUNT
            ? (allocateAmountByWeight(
                Number(expense.amount),
                expense.shares.map((share) => ({
                  memberId: share.member_id,
                  weight: finalMealCounts.get(share.member_id) ?? 0,
                })),
              ).get(userId) ?? 0)
            : Number(storedShare?.share_amount ?? 0);

        return {
          id: expense.id,
          title: this.expenseItemsTitle(
            expense.items.map((item) => ({ itemName: item.item_name })),
            expense.category,
          ),
          expenseDate: expense.expense_date,
          memberShare: roundMoney(memberShare),
          sharedWith: expense.used_by,
          splitRule: expense.split_method,
          note: expense.description,
        };
      })
      .filter((expense) => expense.memberShare > 0);

    return {
      ...summary.myView,
      month: summary.month,
      assignedFoodExpenseTotal: roundMoney(
        assignedFoodExpenses.reduce(
          (sum, expense) => sum + expense.memberShare,
          0,
        ),
      ),
      assignedFoodExpenses,
      history: history.map((expense) => this.mapExpense(expense)),
    };
  }

  async getManagerMemberExpenses(
    messId: string,
    userId: string,
    role: AuthRole,
    month: string,
  ) {
    await this.verifyManagerAccess(messId, userId, role);
    const { start } = this.monthRange(month);
    const billingState = await this.billReconciliation.ensureScheduled(
      messId,
      start,
    );

    const bills = await this.prisma.monthlyBill.findMany({
      where: { mess_id: messId, month: start },
      orderBy: { member: { name: 'asc' } },
      select: {
        member_id: true,
        food_bill: true,
        seat_rent: true,
        utility_share: true,
        deposit_total: true,
        paid_amount: true,
        final_due: true,
        status: true,
        member: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      month: start,
      billing: billingState
        ? {
            status: billingState.status,
            requestedAt: billingState.requested_at,
            calculatedAt: billingState.calculated_at,
          }
        : null,
      totals: {
        totalExpenses: roundMoney(
          bills.reduce(
            (sum, bill) =>
              sum +
              Number(bill.food_bill) +
              Number(bill.seat_rent) +
              Number(bill.utility_share),
            0,
          ),
        ),
        totalUtility: roundMoney(
          bills.reduce((sum, bill) => sum + Number(bill.utility_share), 0),
        ),
        fromDeposit: roundMoney(
          bills.reduce(
            (sum, bill) =>
              sum + Number(bill.deposit_total) + Number(bill.paid_amount),
            0,
          ),
        ),
        members: bills.length,
      },
      members: bills.map((bill) => {
        const totalCost = roundMoney(
          Number(bill.food_bill) +
            Number(bill.seat_rent) +
            Number(bill.utility_share),
        );
        const depositPaid = roundMoney(
          Number(bill.deposit_total) + Number(bill.paid_amount),
        );
        return {
          member: bill.member,
          totalCost,
          depositPaid,
          due: Number(bill.final_due),
          status: bill.status,
        };
      }),
    };
  }

  private buildWhere(query: ExpenseFilterDto): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.category) where.category = query.category;
    if (query.approvalStatus) {
      where.status = {
        PENDING: ExpenseStatus.DRAFT,
        APPROVED: ExpenseStatus.CONFIRMED,
        REJECTED: ExpenseStatus.CANCELLED,
      }[query.approvalStatus];
    }
    if (query.userName) {
      where.OR = [
        {
          creator: { name: { contains: query.userName, mode: 'insensitive' } },
        },
        {
          purchaser: {
            name: { contains: query.userName, mode: 'insensitive' },
          },
        },
      ];
    }
    if (query.billingMonth) {
      where.billing_month = this.monthStart(query.billingMonth);
    }
    if (query.startDate || query.endDate) {
      where.expense_date = {
        ...(query.startDate && { gte: new Date(`${query.startDate}T00:00:00.000Z`) }),
        ...(query.endDate && { lte: new Date(`${query.endDate}T23:59:59.999Z`) }),
      };
    }
    return where;
  }
}
