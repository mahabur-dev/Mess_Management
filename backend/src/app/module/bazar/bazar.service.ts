import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, ShoppingListStatus } from '@prisma/client';
import {
  BazarFilterDto,
  CreateBazarDto,
  UpdateBazarDto,
} from './dto/bazar.dto';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BazarService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyMessAccess(
    messId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    if (role === 'ADMIN') return;
    if (role === 'MANAGER' && mess.created_by === userId) return;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!membership?.is_active) {
      throw new HttpException(
        'Forbidden: You are not a member of this mess',
        403,
      );
    }
  }

  async create(userId: string, role: string, dto: CreateBazarDto) {
    await this.verifyMessAccess(dto.messId, userId, role);

    const totalBudget = dto.items.reduce((sum, item) => sum + item.price, 0);

    return this.prisma.shoppingList.create({
      data: {
        mess_id: dto.messId,
        created_by: userId,
        title: dto.name,
        market_date: dto.date ? new Date(dto.date) : new Date(),
        total_budget: totalBudget,
        items: {
          create: dto.items.map((item) => ({
            name: item.itemName,
            quantity: 1,
            estimated_price: item.price,
          })),
        },
      },
      include: {
        items: true,
        creator: { select: { id: true, name: true } },
        mess: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: BazarFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);

    const where = this.buildWhere(query);

    const [total, bazars] = await Promise.all([
      this.prisma.shoppingList.count({ where }),
      this.prisma.shoppingList.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy === 'date' ? 'market_date' : sortBy]: sortOrder },
        include: {
          items: true,
          creator: { select: { id: true, name: true } },
          mess: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      data: bazars,
      meta: buildMeta(total, page, limit),
    };
  }

  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: BazarFilterDto,
  ) {
    await this.verifyMessAccess(messId, userId, role);
    return this.findAll({ ...query, messId });
  }

  async findOne(id: string, userId: string, role: string) {
    const bazar = await this.prisma.shoppingList.findUnique({
      where: { id },
      include: {
        items: true,
        creator: { select: { id: true, name: true } },
        mess: { select: { id: true, name: true } },
      },
    });

    if (!bazar) throw new HttpException('Bazar entry not found', 404);

    await this.verifyMessAccess(bazar.mess_id, userId, role);
    return bazar;
  }

  async update(id: string, userId: string, role: string, dto: UpdateBazarDto) {
    const bazar = await this.prisma.shoppingList.findUnique({ where: { id } });
    if (!bazar) throw new HttpException('Bazar entry not found', 404);

    if (role === 'MEMBER' && bazar.created_by !== userId) {
      throw new HttpException('Forbidden: Not your bazar entry', 403);
    }

    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({
        where: { id: bazar.mess_id },
      });
      if (mess?.created_by !== userId) {
        throw new HttpException('Forbidden: Not your mess', 403);
      }
    }

    const totalBudget = dto.items?.reduce((sum, item) => sum + item.price, 0);

    return this.prisma.shoppingList.update({
      where: { id },
      data: {
        title: dto.name,
        market_date: dto.date ? new Date(dto.date) : undefined,
        total_budget: totalBudget,
        status: dto.items ? ShoppingListStatus.OPEN : undefined,
        items: dto.items
          ? {
              deleteMany: {},
              create: dto.items.map((item) => ({
                name: item.itemName,
                quantity: 1,
                estimated_price: item.price,
              })),
            }
          : undefined,
      },
      include: { items: true, creator: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, userId: string, role: string) {
    const bazar = await this.prisma.shoppingList.findUnique({ where: { id } });
    if (!bazar) throw new HttpException('Bazar entry not found', 404);

    if (role === 'MEMBER' && bazar.created_by !== userId) {
      throw new HttpException('Forbidden: Not your bazar entry', 403);
    }

    if (role === 'MANAGER') {
      const mess = await this.prisma.mess.findUnique({
        where: { id: bazar.mess_id },
      });
      if (mess?.created_by !== userId) {
        throw new HttpException('Forbidden: Not your mess', 403);
      }
    }

    await this.prisma.shoppingList.delete({ where: { id } });
    return { message: 'Bazar entry deleted successfully' };
  }

  private buildWhere(query: BazarFilterDto): Prisma.ShoppingListWhereInput {
    const where: Prisma.ShoppingListWhereInput = {};

    if (query.searchTerm) {
      where.title = { contains: query.searchTerm, mode: 'insensitive' };
    }
    if (query.messId) where.mess_id = query.messId;
    if (query.userId) where.created_by = query.userId;
    if (query.startDate || query.endDate) {
      where.market_date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    return where;
  }
}
