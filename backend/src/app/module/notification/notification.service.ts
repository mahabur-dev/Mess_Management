import { HttpException, Injectable } from '@nestjs/common';
import { CreateNotificationDto, NotificationFilterDto } from './dto/notification.dto';
import { NotificationType, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly notificationSelect = {
    id: true,
    type: true,
    title: true,
    body: true,
    metadata: true,
    created_at: true,
    mess: { select: { id: true, name: true } },
    sender: { select: { id: true, name: true, email: true } },
    reads: { select: { user_id: true, read_at: true } },
  } as const;

  async create(senderId: string, role: string, dto: CreateNotificationDto) {
    if (role !== 'ADMIN') {
      const mess = await this.prisma.mess.findUnique({
        where: { id: dto.messId },
      });
      if (!mess) throw new HttpException('Mess not found', 404);
      if (mess.created_by !== senderId) {
        throw new HttpException(
          'Forbidden: Only managers can send notifications',
          403,
        );
      }
    }

    return this.prisma.notification.create({
      data: {
        mess_id: dto.messId,
        sender_id: senderId,
        type: dto.type as NotificationType,
        title: dto.title,
        body: dto.body,
        metadata: dto.metadata ?? Prisma.JsonNull,
      },
      select: this.notificationSelect,
    });
  }

  async findAll(query: NotificationFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);

    const where: Prisma.NotificationWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.type) where.type = query.type;

    const [total, notifications] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: this.notificationSelect,
      }),
    ]);

    return {
      data: notifications,
      meta: buildMeta(total, page, limit),
    };
  }

  async findByMess(
    messId: string,
    userId: string,
    role: string,
    query: NotificationFilterDto,
  ) {
    if (role !== 'ADMIN') {
      const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
      if (!mess) throw new HttpException('Mess not found', 404);

      const membership = await this.prisma.messMembership.findUnique({
        where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
      });
      if (!membership?.is_active && mess.created_by !== userId) {
        throw new HttpException('Forbidden: Not a member of this mess', 403);
      }
    }

    return this.findAll({ ...query, messId });
  }

  async findOne(id: string, userId: string, role: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: this.notificationSelect,
    });

    if (!notification) throw new HttpException('Notification not found', 404);

    if (role !== 'ADMIN') {
      const membership = await this.prisma.messMembership.findUnique({
        where: {
          mess_id_user_id: { mess_id: notification.mess.id, user_id: userId },
        },
      });
      const mess = await this.prisma.mess.findUnique({
        where: { id: notification.mess.id },
      });
      if (!membership?.is_active && mess?.created_by !== userId) {
        throw new HttpException('Forbidden: Not a member of this mess', 403);
      }
    }

    return notification;
  }

  async markAsRead(id: string, userId: string, role: string) {
    const notification = await this.findOne(id, userId, role);

    const existing = await this.prisma.notificationRead.findUnique({
      where: { notification_id_user_id: { notification_id: id, user_id: userId } },
    });

    if (existing) return { message: 'Notification already marked as read' };

    await this.prisma.notificationRead.create({
      data: { notification_id: id, user_id: userId },
    });

    return { message: 'Notification marked as read', notificationId: notification.id };
  }

  async remove(id: string, userId: string, role: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new HttpException('Notification not found', 404);

    if (role !== 'ADMIN') {
      const mess = await this.prisma.mess.findUnique({
        where: { id: notification.mess_id },
      });
      if (mess?.created_by !== userId) {
        throw new HttpException('Forbidden: Not your mess', 403);
      }
    }

    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted successfully' };
  }
}
