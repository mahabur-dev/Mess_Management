import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateSubscriptionDto,
  SubscriptionFilterDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import pick from 'src/app/helpers/pick';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly subscriptionSelect = {
    id: true,
    mess_id: true,
    plan: true,
    status: true,
    start_date: true,
    end_date: true,
    cancelled_at: true,
    created_at: true,
    updated_at: true,
    mess: {
      select: {
        id: true,
        name: true,
        address: true,
        _count: { select: { memberships: { where: { is_active: true } } } },
      },
    },
  } as const;

  private readonly planPrices: Record<string, { price: number; label: string; days: number }> = {
    TRIAL: { price: 0, label: '7 Days Free', days: 7 },
    MONTHLY: { price: 499, label: '1 Month', days: 30 },
    YEARLY: { price: 4999, label: '1 Year', days: 365 },
  };

  getPlanInfo(plan: string) {
    return this.planPrices[plan] ?? null;
  }

  getAllPlanInfo() {
    return this.planPrices;
  }

  async create(dto: CreateSubscriptionDto) {
    const mess = await this.prisma.mess.findUnique({
      where: { id: dto.messId },
    });
    if (!mess) throw new HttpException('Mess not found', 404);

    const existing = await this.prisma.subscription.findUnique({
      where: { mess_id: dto.messId },
    });
    if (existing) throw new HttpException('Subscription already exists for this mess', 400);

    const planInfo = this.planPrices[dto.plan];
    if (!planInfo) throw new HttpException('Invalid subscription plan', 400);

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planInfo.days);

    return this.prisma.subscription.create({
      data: {
        mess_id: dto.messId,
        plan: dto.plan as any,
        start_date: startDate,
        end_date: endDate,
        status: 'ACTIVE',
      },
      select: this.subscriptionSelect,
    });
  }

  async findAll(query: SubscriptionFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(paginationOptions);

    const where: Prisma.SubscriptionWhereInput = {};
    if (query.status) where.status = query.status as any;
    if (query.plan) where.plan = query.plan as any;

    const [total, subscriptions] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy === 'plan' ? 'plan' : sortBy === 'status' ? 'status' : 'created_at']: sortOrder },
        select: this.subscriptionSelect,
      }),
    ]);

    return {
      data: subscriptions,
      meta: buildMeta(total, page, limit),
    };
  }

  async findByMess(messId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { mess_id: messId },
      select: this.subscriptionSelect,
    });
    if (!subscription) {
      // Return default TRIAL info if no subscription exists
      return { mess_id: messId, plan: 'TRIAL', status: 'ACTIVE', start_date: new Date(), end_date: null };
    }
    return subscription;
  }

  async findOne(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      select: this.subscriptionSelect,
    });
    if (!subscription) throw new HttpException('Subscription not found', 404);
    return subscription;
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });
    if (!subscription) throw new HttpException('Subscription not found', 404);

    const updateData: any = {};
    if (dto.plan) {
      const planInfo = this.planPrices[dto.plan];
      if (!planInfo) throw new HttpException('Invalid subscription plan', 400);
      updateData.plan = dto.plan;
      // Extend end date based on new plan
      const endDate = new Date(subscription.end_date ?? subscription.start_date);
      endDate.setDate(endDate.getDate() + planInfo.days);
      updateData.end_date = endDate;
    }
    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === 'CANCELLED') {
        updateData.cancelled_at = new Date();
      }
    }

    return this.prisma.subscription.update({
      where: { id },
      data: updateData,
      select: this.subscriptionSelect,
    });
  }

  async checkAndUpdateExpired() {
    const now = new Date();
    const expired = await this.prisma.subscription.updateMany({
      where: {
        status: 'ACTIVE',
        end_date: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });
    return { updated: expired.count };
  }

  // Initialize a TRIAL subscription when a mess is created/approved
  async initializeTrial(messId: string) {
    const existing = await this.prisma.subscription.findUnique({
      where: { mess_id: messId },
    });
    if (existing) return existing;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // 7 days free trial

    return this.prisma.subscription.create({
      data: {
        mess_id: messId,
        plan: 'TRIAL',
        start_date: startDate,
        end_date: endDate,
        status: 'ACTIVE',
      },
      select: this.subscriptionSelect,
    });
  }
}