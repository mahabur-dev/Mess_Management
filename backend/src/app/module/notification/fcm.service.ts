import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { JWT } from 'google-auth-library';
import { PushDevicePlatform } from '@prisma/client';
import config from '../../config';
import { PrismaService } from 'src/prisma/prisma.service';

export type FcmPushMessage = {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
};

export type FcmDispatchResult = {
  sent: number;
  failed: number;
  totalTokens: number;
  configured: boolean;
};

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private readonly projectId = config.fcm.projectId;
  private readonly client: JWT | null;

  constructor(private readonly prisma: PrismaService) {
    this.client =
      this.projectId && config.fcm.clientEmail && config.fcm.privateKey
        ? new JWT({
            email: config.fcm.clientEmail,
            key: config.fcm.privateKey,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
          })
        : null;
  }

  get isConfigured() {
    return Boolean(this.client && this.projectId);
  }

  async registerToken(
    userId: string,
    token: string,
    appVersion?: string,
  ) {
    return this.prisma.fcmDeviceToken.upsert({
      where: { token },
      create: {
        user_id: userId,
        token,
        platform: PushDevicePlatform.ANDROID,
        app_version: appVersion,
      },
      update: {
        user_id: userId,
        platform: PushDevicePlatform.ANDROID,
        app_version: appVersion,
        is_active: true,
        last_used_at: new Date(),
      },
      select: {
        id: true,
        user_id: true,
        platform: true,
        is_active: true,
        updated_at: true,
      },
    });
  }

  async unregisterToken(userId: string, token: string) {
    await this.prisma.fcmDeviceToken.updateMany({
      where: { user_id: userId, token },
      data: { is_active: false },
    });

    return { message: 'FCM device token removed' };
  }

  async getStatus(userId: string) {
    const tokens = await this.prisma.fcmDeviceToken.findMany({
      where: { user_id: userId, is_active: true },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        platform: true,
        app_version: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        last_used_at: true,
      },
    });

    return {
      configured: this.isConfigured,
      hasActiveDevice: tokens.length > 0,
      activeDeviceCount: tokens.length,
      devices: tokens,
    };
  }

  async sendToUsers(
    userIds: string[],
    message: FcmPushMessage,
  ): Promise<FcmDispatchResult> {
    const uniqueUserIds = [...new Set(userIds)].filter(Boolean);
    if (!this.isConfigured || uniqueUserIds.length === 0) {
      return {
        sent: 0,
        failed: 0,
        totalTokens: 0,
        configured: this.isConfigured,
      };
    }

    const tokens = await this.prisma.fcmDeviceToken.findMany({
      where: { user_id: { in: uniqueUserIds }, is_active: true },
      select: { id: true, token: true },
    });

    let sent = 0;
    let failed = 0;

    await Promise.all(
      tokens.map(async (device) => {
        try {
          await this.sendToToken(device.token, message);
          sent += 1;
          await this.prisma.fcmDeviceToken.update({
            where: { id: device.id },
            data: { last_used_at: new Date() },
          });
        } catch (error) {
          failed += 1;
          if (this.isInvalidTokenError(error)) {
            await this.prisma.fcmDeviceToken.update({
              where: { id: device.id },
              data: { is_active: false },
            });
          } else {
            this.logger.warn(`FCM delivery failed for device ${device.id}`);
          }
        }
      }),
    );

    return {
      sent,
      failed,
      totalTokens: tokens.length,
      configured: true,
    };
  }

  private async sendToToken(token: string, message: FcmPushMessage) {
    if (!this.client || !this.projectId) return;

    const { token: accessToken } = await this.client.getAccessToken();
    if (!accessToken) throw new Error('Unable to obtain Firebase access token');

    const data = Object.fromEntries(
      Object.entries({ url: message.url || '/', ...(message.data ?? {}) }).map(
        ([key, value]) => [
          key,
          value == null
            ? ''
            : typeof value === 'string'
              ? value
              : JSON.stringify(value) ?? '',
        ],
      ),
    );

    await axios.post(
      `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`,
      {
        message: {
          token,
          notification: {
            title: message.title,
            body: message.body,
          },
          data,
          android: {
            priority: 'HIGH',
            notification: {
              channel_id: 'messzen_notifications',
              sound: 'default',
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 12_000,
      },
    );
  }

  private isInvalidTokenError(error: unknown) {
    if (!axios.isAxiosError(error)) return false;

    const status = error.response?.status;
    const response = error.response?.data as {
      error?: { status?: string; details?: Array<{ errorCode?: string }> };
    } | undefined;
    const errorStatus = response?.error?.status;
    const detailCodes = response?.error?.details?.map((detail) => detail.errorCode) ?? [];

    return (
      status === 404 ||
      errorStatus === 'NOT_FOUND' ||
      detailCodes.includes('UNREGISTERED')
    );
  }
}
