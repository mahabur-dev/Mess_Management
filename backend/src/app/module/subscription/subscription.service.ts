import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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
  features: string[];
};

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

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
      label: '30 Days Free',
      days: 30,
      description: 'One month of trial access for newly created messes.',
      currency: 'BDT',
      features: [
        'Smart Meal Tracking|Track breakfast, lunch & dinner with real-time member toggles and daily meal sheets.',
        'Member Management|Invite members, assign roles (Manager/Member), manage rooms & seats.',
        'Bazar & Expense Control|Record daily purchases, categorize expenses, and maintain transparent food costs.',
        'Auto Monthly Billing|Generate bills from meals, rent, utilities & deposits automatically each month.',
        'Notice & Communication|Publish notices, manage complaints, and keep everyone informed instantly.',
        'Dashboard & Reports|View meal stats, dues, payments & performance with clean visual dashboards.',
      ],
    },
    MONTHLY: {
      price: 499,
      label: '1 Month',
      days: 30,
      description: 'Perfect for active messes needing full features monthly.',
      currency: 'BDT',
      features: [
        'Smart Meal Tracking|Track breakfast, lunch & dinner with real-time member toggles and daily meal sheets.',
        'Unlimited Member Management|Invite unlimited members, assign roles, manage rooms & seats effortlessly.',
        'Advanced Expense Tracking|Record daily purchases, categorize expenses, and maintain transparent food costs.',
        'Auto Monthly Billing|Generate bills from meals, rent, utilities & deposits automatically each month.',
        'Priority Support|Get priority assistance from our support team whenever you need help.',
        'Full Dashboard & Reports|View meal stats, dues, payments & performance with clean visual dashboards.',
      ],
    },
    YEARLY: {
      price: 4999,
      label: '1 Year',
      days: 365,
      description: 'Best value annual subscription with longer coverage and maximum savings.',
      currency: 'BDT',
      features: [
        'Smart Meal Tracking|Track breakfast, lunch & dinner with real-time member toggles and daily meal sheets.',
        'Unlimited Member Management|Invite unlimited members, assign roles, manage rooms & seats effortlessly.',
        'Advanced Expense Tracking|Record daily purchases, categorize expenses, and maintain transparent food costs.',
        'Auto Monthly Billing|Generate bills from meals, rent, utilities & deposits automatically each month.',
        'Priority Support|Get priority assistance from our support team whenever you need help.',
        'Best Value Pricing|Save big with annual billing — get 2 months free compared to monthly plan.',
      ],
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
            features: defaults.features,
          },
          update: {},
        }),
      ),
    );

    // Fill empty features for any pre-migration records that have empty array
    const emptyFeaturesRecords = await this.prisma.subscriptionPlanSetting.findMany({
      where: { features: { equals: [] } },
    });
    if (emptyFeaturesRecords.length > 0) {
      await Promise.all(
        emptyFeaturesRecords.map((record) => {
          const defaults = this.defaultPlanSettings[record.plan];
          if (defaults) {
            return this.prisma.subscriptionPlanSetting.update({
              where: { plan: record.plan },
              data: { features: defaults.features },
            });
          }
          return Promise.resolve(record);
        }),
      );
    }
  }

  private mapPlanSetting(setting: {
    plan: SubscriptionPlan;
    label: string;
    price: Prisma.Decimal | number | string;
    days: number;
    description: string;
    currency: string;
    features: string[];
  }) {
    return {
      price: Number(setting.price),
      label: setting.label,
      days: setting.days,
      description: setting.description,
      currency: setting.currency,
      features: setting.features,
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

    const updateData: Record<string, unknown> = {};
    const startDate = dto.startDate ? new Date(dto.startDate) : subscription.start_date
    const endDate = dto.endDate ? new Date(dto.endDate) : subscription.end_date ?? null

    if (dto.plan) {
      const planInfo = await this.getPlanInfo(dto.plan);
      if (!planInfo) throw new HttpException('Invalid subscription plan', 400);
      updateData.plan = dto.plan;
      updateData.end_date = addDays(startDate, planInfo.days);
    }
    if (dto.startDate) {
      updateData.start_date = startDate;
    }
    if (dto.endDate) {
      updateData.end_date = endDate;
    }
    if (dto.days !== undefined && dto.days !== null) {
      updateData.end_date = addDays(startDate, dto.days);
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
        features: dto.features ?? existing.features,
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

  /**
   * Runs once every 24 hours to keep stored subscription status in sync with
   * end_date. Runtime feature checks still validate end_date directly.
   */
  @Cron('5 0 * * *', { timeZone: 'Asia/Dhaka' })
  async checkExpiredSubscriptionsDaily() {
    try {
      const result = await this.checkAndUpdateExpired();
      if (result.updated > 0) {
        this.logger.warn(`Marked ${result.updated} subscription(s) as expired`);
      }
    } catch (error) {
      this.logger.error('Failed to update expired subscriptions', error);
    }
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
    endDate.setDate(endDate.getDate() + (trialPlan?.days ?? 30)); // 30 days free trial

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
