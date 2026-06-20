import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, SubscriptionPlan } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateSubscriptionDto,
  SubscriptionFilterDto,
  UpdateSubscriptionDto,
  UpdateSubscriptionPlanDto,
} from './dto/subscription.dto';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import pick from 'src/app/helpers/pick';

type PlanRecord = {
  price: number;
  label: string;
  days: number;
  description: string;
  currency: string;
};

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

  private readonly defaultPlanSettings: Record<SubscriptionPlan, PlanRecord> = {
    TRIAL: {
      price: 0,
      label: '7 Days Free',
      days: 7,
      description: 'Trial access for newly approved messes.',
      currency: 'BDT',
    },
    MONTHLY: {
      price: 499,
      label: '1 Month',
      days: 30,
      description: 'Standard monthly subscription for active messes.',
      currency: 'BDT',
    },
    YEARLY: {
      price: 4999,
      label: '1 Year',
      days: 365,
      description: 'Best value annual subscription with longer coverage.',
      currency: 'BDT',
    },
  };

  private async ensurePlanSettings() {
    await Promise.all(
      Object.entries(this.defaultPlanSettings).map(([plan, defaults]) =>
        this.prisma.subscriptionPlanSetting.upsert({
          where: { plan: plan as SubscriptionPlan },
          create: {
            plan: plan as SubscriptionPlan,
            label: defaults.label,
            price: defaults.price,
            days: defaults.days,
            description: defaults.description,
            currency: defaults.currency,
          },
          update: {},
        }),
      ),
    );
  }

  private mapPlanSetting(setting: {
    plan: SubscriptionPlan;
    label: string;
    price: Prisma.Decimal | number | string;
    days: number;
    description: string;
    currency: string;
  }) {
    return {
      price: Number(setting.price),
      label: setting.label,
      days: setting.days,
      description: setting.description,
      currency: setting.currency,
    };
  }

  async getPlanInfo(plan: SubscriptionPlan) {
    await this.ensurePlanSettings();
    const setting = await this.prisma.subscriptionPlanSetting.findUnique({
      where: { plan },
    });
    return setting ? this.mapPlanSetting(setting) : this.defaultPlanSettings[plan] ?? null;
  }

  async getAllPlanInfo() {
    await this.ensurePlanSettings();
    const settings = await this.prisma.subscriptionPlanSetting.findMany({
      orderBy: { plan: 'asc' },
    });

    return settings.reduce<Record<string, PlanRecord>>((acc, setting) => {
      acc[setting.plan] = this.mapPlanSetting(setting);
      return acc;
    }, {});
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

    const planInfo = await this.getPlanInfo(dto.plan);
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
      const planInfo = await this.getPlanInfo(dto.plan);
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

  async updatePlan(plan: SubscriptionPlan, dto: UpdateSubscriptionPlanDto) {
    await this.ensurePlanSettings();
    const existing = await this.prisma.subscriptionPlanSetting.findUnique({
      where: { plan },
    });
    if (!existing) throw new HttpException('Plan not found', 404);

    const updated = await this.prisma.subscriptionPlanSetting.update({
      where: { plan },
      data: {
        label: dto.label ?? existing.label,
        price: dto.price ?? existing.price,
        days: dto.days ?? existing.days,
        description: dto.description ?? existing.description,
        currency: dto.currency ?? existing.currency,
      },
    });

    return this.mapPlanSetting(updated);
  }

  async remove(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });
    if (!subscription) throw new HttpException('Subscription not found', 404);

    return this.prisma.subscription.delete({
      where: { id },
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
    const trialPlan = await this.getPlanInfo('TRIAL');
    endDate.setDate(endDate.getDate() + (trialPlan?.days ?? 7)); // 7 days free trial

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
