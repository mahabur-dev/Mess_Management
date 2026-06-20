import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello() {
    return {
      name: 'Mess Management Backend API',
      status: 'ok',
      swaggerUrl: `/api/docs`,
      version: '1.0.0',
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
      };
    });
  }

  getSubscriptionPlans() {
    return {
      TRIAL: { price: 0, label: '7 Days Free', days: 7, description: 'Get started with a free trial. No credit card required.' },
      MONTHLY: { price: 499, label: '1 Month', days: 30, description: 'Perfect for active messes needing full features monthly.', currency: '৳' },
      YEARLY: { price: 4999, label: '1 Year', days: 365, description: 'Best value for long-term mess management.', currency: '৳' },
    };
  }
}
