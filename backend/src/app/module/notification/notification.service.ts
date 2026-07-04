import { HttpException, Injectable } from '@nestjs/common';
import {
  CreateNotificationDto,
  NotificationFilterDto,
  SavePushSubscriptionDto,
  SendPushNotificationDto,
} from './dto/notification.dto';
import { NotificationType, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import webPush, { type PushSubscription } from 'web-push';
import config from '../../config';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {
    this.configureWebPush();
  }

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

  private configureWebPush() {
    const publicKey = config.webPush.vapidPublicKey;
    const privateKey = config.webPush.vapidPrivateKey;

    if (!publicKey || !privateKey) return;

    webPush.setVapidDetails(
      config.webPush.vapidSubject || 'mailto:support@mess-management.local',
      publicKey,
      privateKey,
    );
  }

  getPushPublicKey() {
    const publicKey = config.webPush.vapidPublicKey;
    if (!publicKey) {
      throw new HttpException('Push notifications are not configured', 503);
    }

    return { publicKey };
  }

  async getPushSubscriptionStatus(userId: string) {
    await this.ensureUserExists(userId);

    const [activeSubscriptionCount, latestSubscription] = await Promise.all([
      this.prisma.pushNotificationSubscription.count({
        where: { user_id: userId, is_active: true },
      }),
      this.prisma.pushNotificationSubscription.findFirst({
        where: { user_id: userId, is_active: true },
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          endpoint: true,
          user_agent: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          last_used_at: true,
        },
      }),
    ]);

    return {
      hasActiveSubscription: activeSubscriptionCount > 0,
      activeSubscriptionCount,
      latestSubscription,
    };
  }

  async savePushSubscription(
    userId: string,
    dto: SavePushSubscriptionDto,
  ) {
    await this.ensureUserExists(userId);

    const subscription = await this.prisma.pushNotificationSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        user_id: userId,
        endpoint: dto.endpoint,
        p256dh_key: dto.keys.p256dh,
        auth_key: dto.keys.auth,
        user_agent: dto.userAgent,
      },
      update: {
        user_id: userId,
        p256dh_key: dto.keys.p256dh,
        auth_key: dto.keys.auth,
        user_agent: dto.userAgent,
        is_active: true,
        last_used_at: new Date(),
      },
      select: { id: true, user_id: true, is_active: true, updated_at: true },
    });

    return {
      message: 'Push notification subscription saved',
      subscription,
    };
  }

  async removePushSubscription(userId: string, endpoint: string) {
    await this.prisma.pushNotificationSubscription.updateMany({
      where: { user_id: userId, endpoint },
      data: { is_active: false },
    });

    return { message: 'Push notification subscription removed' };
  }

  async sendPushToUser(userId: string, dto: SendPushNotificationDto) {
    await this.ensureUserExists(userId);
    const result = await this.dispatchPushToUsers([userId], dto);

    return {
      message: 'Push notification sent to user',
      ...result,
    };
  }

  async sendPushToAll(dto: SendPushNotificationDto) {
    const users = await this.prisma.user.findMany({
      where: { is_active: true },
      select: { id: true },
    });
    const result = await this.dispatchPushToUsers(
      users.map((user) => user.id),
      dto,
    );

    return {
      message: 'Push notification sent to all users',
      ...result,
    };
  }

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

    const notification = await this.prisma.notification.create({
      data: {
        mess_id: dto.messId,
        sender_id: senderId,
        type: dto.type as NotificationType,
        title: dto.title,
        body: dto.body,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
      select: this.notificationSelect,
    });

    const targetUserIds = await this.resolveNotificationPushTargets(dto);
    if (targetUserIds.length > 0) {
      await this.dispatchPushToUsers(targetUserIds, {
        title: dto.title,
        body: dto.body,
        url: '/',
        data: {
          notificationId: notification.id,
          messId: dto.messId,
          type: dto.type,
          ...(dto.metadata ?? {}),
        },
      });
    }

    return notification;
  }

  async createForMess(
    senderId: string | null,
    messId: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata?: Record<string, unknown>,
    targetUserIds?: string[],
    url = '/dashboard/notifications',
    dedupeKey?: string,
  ) {
    if (dedupeKey) {
      const existing = await this.prisma.notification.findUnique({
        where: { dedupe_key: dedupeKey },
        select: this.notificationSelect,
      });

      if (existing) {
        return existing;
      }
    }

    try {
      const notification = await this.prisma.notification.create({
        data: {
          mess_id: messId,
          sender_id: senderId,
          dedupe_key: dedupeKey,
          type,
          title,
          body,
          metadata: metadata as Prisma.InputJsonValue | undefined,
        },
        select: this.notificationSelect,
      });

      const resolvedTargets =
        targetUserIds ?? (await this.resolveMessUserIds(messId));

      await this.dispatchPushToUsers(resolvedTargets, {
        title,
        body,
        url,
        data: {
          notificationId: notification.id,
          messId,
          type,
          ...(metadata ?? {}),
        },
      });

      return notification;
    } catch (error) {
      const isDuplicate = (error as { code?: string }).code === 'P2002';
      if (dedupeKey && isDuplicate) {
        const existing = await this.prisma.notification.findUnique({
          where: { dedupe_key: dedupeKey },
          select: this.notificationSelect,
        });
        if (existing) return existing;
      }

      throw error;
    }
  }

  async sendPushToUsers(userIds: string[], dto: SendPushNotificationDto) {
    const result = await this.dispatchPushToUsers(userIds, dto);
    return {
      message: 'Push notification sent to users',
      ...result,
    };
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

  async findMine(userId: string, role: string, query: NotificationFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);

    const where = await this.buildAccessibleNotificationWhere(
      userId,
      role,
      query,
    );

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

  async getUnreadCount(userId: string, role: string) {
    const where = await this.buildAccessibleNotificationWhere(userId, role, {});
    const count = await this.prisma.notification.count({
      where: {
        ...where,
        reads: { none: { user_id: userId } },
      },
    });

    return { count };
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

    if (role === 'ADMIN') {
      await this.prisma.notification.delete({ where: { id } });
      return { message: 'Notification deleted successfully' };
    }

    await this.findOne(id, userId, role);

    const metadata =
      notification.metadata &&
      typeof notification.metadata === 'object' &&
      !Array.isArray(notification.metadata)
        ? (notification.metadata as Record<string, unknown>)
        : {};
    const hiddenFor = Array.isArray(metadata.hiddenFor)
      ? metadata.hiddenFor.filter((value): value is string => typeof value === 'string')
      : [];

    await this.prisma.notification.update({
      where: { id },
      data: {
        metadata: {
          ...metadata,
          hiddenFor: [...new Set([...hiddenFor, userId])],
        } as Prisma.InputJsonValue,
      },
    });

    return { message: 'Notification deleted successfully' };
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) throw new HttpException('User not found', 404);
  }

  private async resolveNotificationPushTargets(dto: CreateNotificationDto) {
    if (dto.sendToAll) {
      const users = await this.prisma.user.findMany({
        where: { is_active: true },
        select: { id: true },
      });

      return users.map((user) => user.id);
    }

    if (dto.targetUserId) return [dto.targetUserId];

    return this.resolveMessUserIds(dto.messId);
  }

  async resolveMessUserIds(messId: string) {
    const [mess, memberships] = await Promise.all([
      this.prisma.mess.findUnique({
        where: { id: messId },
        select: { created_by: true },
      }),
      this.prisma.messMembership.findMany({
        where: { mess_id: messId, is_active: true },
        select: { user_id: true },
      }),
    ]);

    return [
      ...new Set([
        ...(mess?.created_by ? [mess.created_by] : []),
        ...memberships.map((membership) => membership.user_id),
      ]),
    ];
  }

  async resolveMessManagerAndAdminUserIds(messId: string) {
    const [mess, managerMemberships, admins] = await Promise.all([
      this.prisma.mess.findUnique({
        where: { id: messId },
        select: { created_by: true },
      }),
      this.prisma.messMembership.findMany({
        where: { mess_id: messId, is_active: true, role: 'MANAGER' },
        select: { user_id: true },
      }),
      this.prisma.user.findMany({
        where: { role: 'ADMIN', is_active: true },
        select: { id: true },
      }),
    ]);

    return [
      ...new Set([
        ...(mess?.created_by ? [mess.created_by] : []),
        ...managerMemberships.map((membership) => membership.user_id),
        ...admins.map((admin) => admin.id),
      ]),
    ];
  }

  async resolveAdminUserIds() {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', is_active: true },
      select: { id: true },
    });

    return admins.map((admin) => admin.id);
  }

  private async buildAccessibleNotificationWhere(
    userId: string,
    role: string,
    query: Pick<NotificationFilterDto, 'messId' | 'type'>,
  ) {
    const where: Prisma.NotificationWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.type) where.type = query.type;

    if (role === 'ADMIN') return where;

    const messes = await this.prisma.mess.findMany({
      where: {
        OR: [
          { created_by: userId },
          { memberships: { some: { user_id: userId, is_active: true } } },
        ],
      },
      select: { id: true },
    });

    const accessibleMessIds = messes.map((mess) => mess.id);
    where.mess_id = query.messId
      ? query.messId
      : { in: accessibleMessIds };
    where.NOT = {
      metadata: {
        path: ['hiddenFor'],
        array_contains: userId,
      },
    };

    return where;
  }

  private async dispatchPushToUsers(
    userIds: string[],
    dto: SendPushNotificationDto,
  ) {
    const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
    if (uniqueUserIds.length === 0) {
      return { sent: 0, failed: 0, totalSubscriptions: 0 };
    }

    const subscriptions =
      await this.prisma.pushNotificationSubscription.findMany({
        where: { user_id: { in: uniqueUserIds }, is_active: true },
      });

    const payload = JSON.stringify({
      title: dto.title,
      body: dto.body,
      url: dto.url || '/',
      data: dto.data ?? {},
    });

    let sent = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh_key,
                auth: subscription.auth_key,
              },
            } satisfies PushSubscription,
            payload,
          );

          sent += 1;
          await this.prisma.pushNotificationSubscription.update({
            where: { id: subscription.id },
            data: { last_used_at: new Date() },
          });
        } catch (error) {
          failed += 1;
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushNotificationSubscription.update({
              where: { id: subscription.id },
              data: { is_active: false },
            });
          }
        }
      }),
    );

    return { sent, failed, totalSubscriptions: subscriptions.length };
  }
}
