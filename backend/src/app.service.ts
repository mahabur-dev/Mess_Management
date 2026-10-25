import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubscriptionService } from './app/module/subscription/subscription.service';
import { isSwaggerEnabled } from './app/config/swagger.policy';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  getHello() {
    return {
      name: 'Mess Management Backend API',
      status: 'ok',
      version: '1.0.0',
      ...(isSwaggerEnabled() ? { swaggerUrl: '/api/docs' } : {}),
    };
  }

  async getPublicMesses() {
    const messes = await this.prisma.mess.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        address: true,
        description: true,
        mess_category: true,
        total_seats: true,
        rooms: true,
        created_at: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            start_date: true,
            end_date: true,
          },
        },
        _count: {
          select: {
            memberships: { where: { is_active: true } },
            meals: true,
          },
        },
        creator: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    return messes.map((mess) => {
      const activeMembers = mess._count.memberships;
      const totalMeals = mess._count.meals;
      const rooms = Array.isArray(mess.rooms) ? mess.rooms : [];
      let totalSeats = 0;
      let availableSeats = 0;

      for (const room of rooms) {
        if (room && typeof room === 'object' && !Array.isArray(room)) {
          const r = room as Record<string, unknown>;
          const capacity = Number(r['perPerson'] ?? 0);
          totalSeats += capacity;
        }
      }
      availableSeats = Math.max(totalSeats - activeMembers, 0);

      return {
        id: mess.id,
        name: mess.name,
        address: mess.address,
        description: mess.description,
        category: mess.mess_category,
        totalMembers: activeMembers,
        totalSeats: mess.total_seats ?? totalSeats,
        availableSeats,
        totalMeals,
        createdAt: mess.created_at,
        creatorName: mess.creator.name,
        subscription: mess.subscription
          ? {
              plan: mess.subscription.plan,
              status: mess.subscription.status,
              startDate: mess.subscription.start_date,
              endDate: mess.subscription.end_date,
            }
          : null,
      };
    });
  }

  async getSubscriptionPlans() {
    return this.subscriptionService.getAllPlanInfo();
  }
}
