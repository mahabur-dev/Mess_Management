import { HttpException, Injectable } from '@nestjs/common';
import {
  CreateShoppingListDto,
  ShoppingFilterDto,
  UpdateShoppingItemDto,
  UpdateShoppingListDto,
} from './dto/shopping.dto';
import { Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ShoppingService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listSelect = {
    id: true,
    title: true,
    market_date: true,
    total_budget: true,
    status: true,
    created_at: true,
    mess: { select: { id: true, name: true } },
    creator: { select: { id: true, name: true, email: true } },
    items: {
      select: {
        id: true,
        name: true,
        quantity: true,
        unit: true,
        estimated_price: true,
        actual_price: true,
        is_purchased: true,
        note: true,
        purchaser: { select: { id: true, name: true } },
      },
    },
  } as const;

  private async verifyMessMember(
    messId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    if (role === 'ADMIN') return;

    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;

    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!membership?.is_active) {
      throw new HttpException('Forbidden: Not a member of this mess', 403);
    }
  }

  private async verifyManagerAccess(
    messId: string,
    userId: string,
    role: string,
  ): Promise<void> {
    if (role === 'ADMIN') return;

    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);

    if (role === 'MANAGER' && mess.created_by === userId) return;

    throw new HttpException(
      'Forbidden: Only managers can perform this action',
      403,
    );
  }

  async createList(
    userId: string,
    role: string,
    dto: CreateShoppingListDto,
  ) {
    await this.verifyManagerAccess(dto.messId, userId, role);

    return this.prisma.shoppingList.create({
      data: {
        mess_id: dto.messId,
        created_by: userId,
        title: dto.title,
        market_date: new Date(dto.marketDate),
        total_budget: dto.totalBudget,
        items: dto.items?.length
          ? {
              create: dto.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                estimated_price: item.estimatedPrice,
                note: item.note,
              })),
            }
          : undefined,
      },
      select: this.listSelect,
    });
  }

  async findAll(query: ShoppingFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);

    const where = this.buildWhere(query);

    const [total, lists] = await Promise.all([
      this.prisma.shoppingList.count({ where }),
      this.prisma.shoppingList.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: this.listSelect,
      }),
    ]);

    return {
      data: lists,
      meta: buildMeta(total, page, limit),
    };
  }

  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: ShoppingFilterDto,
  ) {
    await this.verifyMessMember(messId, userId, role);
    return this.findAll({ ...query, messId });
  }

  async findOne(id: string, userId: string, role: string) {
    const list = await this.prisma.shoppingList.findUnique({
      where: { id },
      select: this.listSelect,
    });

    if (!list) throw new HttpException('Shopping list not found', 404);

    await this.verifyMessMember(list.mess.id, userId, role);

    return list;
  }

  async updateList(
    id: string,
    userId: string,
    role: string,
    dto: UpdateShoppingListDto,
  ) {
    const list = await this.prisma.shoppingList.findUnique({ where: { id } });
    if (!list) throw new HttpException('Shopping list not found', 404);

    await this.verifyManagerAccess(list.mess_id, userId, role);

    return this.prisma.shoppingList.update({
      where: { id },
      data: {
        title: dto.title,
        market_date: dto.marketDate ? new Date(dto.marketDate) : undefined,
        total_budget: dto.totalBudget,
        status: dto.status,
      },
      select: this.listSelect,
    });
  }

  async removeList(id: string, userId: string, role: string) {
    const list = await this.prisma.shoppingList.findUnique({ where: { id } });
    if (!list) throw new HttpException('Shopping list not found', 404);

    await this.verifyManagerAccess(list.mess_id, userId, role);

    await this.prisma.shoppingList.delete({ where: { id } });
    return { message: 'Shopping list deleted successfully' };
  }

  async updateItem(
    itemId: string,
    userId: string,
    role: string,
    dto: UpdateShoppingItemDto,
  ) {
    const item = await this.prisma.shoppingItem.findUnique({
      where: { id: itemId },
      include: { list: { select: { mess_id: true } } },
    });
    if (!item) throw new HttpException('Shopping item not found', 404);

    await this.verifyMessMember(item.list.mess_id, userId, role);

    return this.prisma.shoppingItem.update({
      where: { id: itemId },
      data: {
        name: dto.name,
        quantity: dto.quantity,
        unit: dto.unit,
        estimated_price: dto.estimatedPrice,
        actual_price: dto.actualPrice,
        is_purchased: dto.isPurchased,
        purchased_by: dto.isPurchased ? userId : undefined,
        note: dto.note,
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        unit: true,
        estimated_price: true,
        actual_price: true,
        is_purchased: true,
        note: true,
        purchaser: { select: { id: true, name: true } },
      },
    });
  }

  async removeItem(itemId: string, userId: string, role: string) {
    const item = await this.prisma.shoppingItem.findUnique({
      where: { id: itemId },
      include: { list: { select: { mess_id: true } } },
    });
    if (!item) throw new HttpException('Shopping item not found', 404);

    await this.verifyManagerAccess(item.list.mess_id, userId, role);

    await this.prisma.shoppingItem.delete({ where: { id: itemId } });
    return { message: 'Shopping item deleted successfully' };
  }

  private buildWhere(query: ShoppingFilterDto): Prisma.ShoppingListWhereInput {
    const where: Prisma.ShoppingListWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
      where.market_date = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }
    return where;
  }
}
