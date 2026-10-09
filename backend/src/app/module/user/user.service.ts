import { HttpException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  UpdateUserDto,
  UpdateUserStatusDto,
  UserFilterDto,
} from './dto/user.dto';
import { Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from 'src/app/helpers/fileUploder';
import { PrismaService } from 'src/prisma/prisma.service';
import { FirebaseAuthService } from '../auth/firebase-auth.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) {}

  // ─────────────────────────────────────────
  // Get all users (Admin only)
  // ─────────────────────────────────────────
  async findAll(query: UserFilterDto) {
    const paginationOptions = pick(query, [
      'page',
      'limit',
      'sortBy',
      'sortOrder',
    ]);
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper(paginationOptions);

    const where: Prisma.UserWhereInput = { deleted_at: null };

    if (query.searchTerm) {
      where.OR = [
        { name: { contains: query.searchTerm, mode: 'insensitive' } },
        { email: { contains: query.searchTerm, mode: 'insensitive' } },
      ];
    }

    if (query.role) where.role = query.role;

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          avatar_url: true,
          is_active: true,
          is_verified: true,
          created_at: true,
          preferred_locale: true,
        },
      }),
    ]);

    return {
      data: users,
      meta: buildMeta(total, page, limit),
    };
  }

  // ─────────────────────────────────────────
  // Get single user by ID
  // ─────────────────────────────────────────
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar_url: true,
        nid_number: true,
        nid_image_url: true,
        location: true,
        state: true,
        city: true,
        zipcode: true,
        preferred_locale: true,
        is_active: true,
        is_verified: true,
        created_at: true,
        memberships: {
          where: { is_active: true },
          select: {
            id: true,
            mess_id: true,
            user_id: true,
            role: true,
            joined_at: true,
            left_at: true,
            is_active: true,
            mess: {
              select: { id: true, name: true, address: true },
            },
          },
        },
      },
    });

    if (!user) throw new HttpException('User not found', 404);
    return user;
  }

  // ─────────────────────────────────────────
  // Update own profile
  // ─────────────────────────────────────────
  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
    profileImage?: Express.Multer.File,
    nidImage?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', 404);

    let avatar_url = user.avatar_url;
    let nid_image_url = user.nid_image_url;
    let avatar_public_id = user.avatar_public_id;
    let nid_image_public_id = user.nid_image_public_id;

    const normalizedEmail = dto.email?.trim().toLowerCase();
    if (normalizedEmail && normalizedEmail !== user.email) {
      const emailOwner = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });
      if (emailOwner && emailOwner.id !== userId) {
        throw new HttpException('Email is already in use', 409);
      }
    }

    const normalizedNidNumber = dto.nidNumber?.trim() || null;
    if (normalizedNidNumber && normalizedNidNumber !== user.nid_number) {
      const nidOwner = await this.prisma.user.findUnique({
        where: { nid_number: normalizedNidNumber },
        select: { id: true },
      });
      if (nidOwner && nidOwner.id !== userId) {
        throw new HttpException('NID number is already in use', 409);
      }
    }

    if (profileImage) {
      const uploaded = await uploadToCloudinary(
        profileImage,
        'mess_management/profiles',
      );
      avatar_url = uploaded.url;
      avatar_public_id = uploaded.public_id;
    }

    if (nidImage) {
      const uploaded = await uploadToCloudinary(
        nidImage,
        'mess_management/identity-documents',
        { allowedTypes: ['image'], maxSizeBytes: 5 * 1024 * 1024 },
      );
      nid_image_url = uploaded.url;
      nid_image_public_id = uploaded.public_id;
    }

    const nullableText = (value: string | undefined) => {
      if (value === undefined) return undefined;
      return value.trim() || null;
    };

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name?.trim(),
        email: normalizedEmail,
        phone: nullableText(dto.phone),
        nid_number:
          dto.nidNumber === undefined ? undefined : normalizedNidNumber,
        nid_image_url,
        nid_image_public_id,
        location: nullableText(dto.location),
        state: nullableText(dto.state),
        city: nullableText(dto.city),
        zipcode: nullableText(dto.zipcode),
        preferred_locale: dto.preferredLocale,
        avatar_url,
        avatar_public_id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar_url: true,
        nid_number: true,
        nid_image_url: true,
        location: true,
        state: true,
        city: true,
        zipcode: true,
        preferred_locale: true,
        is_active: true,
        is_verified: true,
        created_at: true,
      },
    });

    return updated;
  }

  // ─────────────────────────────────────────
  // Admin: update user status (activate/deactivate)
  // ─────────────────────────────────────────
  async updateStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpException('User not found', 404);
    if (user.deleted_at) {
      throw new HttpException('Deleted accounts cannot be reactivated', 409);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { is_active: dto.isActive },
      select: { id: true, name: true, email: true, is_active: true },
    });

    return updated;
  }

  // ─────────────────────────────────────────
  // Admin: delete user
  // ─────────────────────────────────────────
  async deleteAccount(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firebase_uid: true,
        avatar_url: true,
        avatar_public_id: true,
        nid_image_url: true,
        nid_image_public_id: true,
        deleted_at: true,
        memberships: {
          where: { is_active: true },
          select: { mess_id: true, role: true },
        },
        created_messes: {
          where: { is_active: true },
          select: { id: true },
        },
      },
    });
    if (!user) throw new HttpException('User not found', 404);
    if (user.deleted_at) {
      throw new HttpException(
        {
          code: 'ACCOUNT_ALREADY_DELETED',
          message: 'Account is already deleted',
        },
        409,
      );
    }

    const managedMessIds = [
      ...new Set([
        ...user.memberships
          .filter((membership) => membership.role === 'MANAGER')
          .map((membership) => membership.mess_id),
        ...user.created_messes.map((mess) => mess.id),
      ]),
    ];

    for (const messId of managedMessIds) {
      const replacementManagers = await this.prisma.messMembership.count({
        where: {
          mess_id: messId,
          role: 'MANAGER',
          is_active: true,
          user_id: { not: id },
        },
      });
      if (!replacementManagers) {
        throw new HttpException(
          {
            code: 'ACCOUNT_MANAGER_TRANSFER_REQUIRED',
            message: 'Assign another manager before deleting this account',
          },
          409,
        );
      }
    }

    const deletedAt = new Date();
    const anonymizedEmail = `deleted+${id}@deleted.messzen.invalid`;
    const invalidPasswordHash = randomBytes(48).toString('hex');

    await this.prisma.$transaction(async (tx) => {
      const auditMemberships = new Map<string, string>(
        user.memberships.map((membership) => [
          membership.mess_id,
          membership.role,
        ]),
      );
      for (const mess of user.created_messes) {
        if (!auditMemberships.has(mess.id))
          auditMemberships.set(mess.id, 'CREATOR');
      }

      if (auditMemberships.size) {
        await tx.auditLog.createMany({
          data: [...auditMemberships.entries()].map(
            ([messId, membershipRole]) => ({
              mess_id: messId,
              actor_id: id,
              action: 'ACCOUNT_DELETED',
              entity_type: 'USER',
              entity_id: id,
              diff: {
                deletedAt: deletedAt.toISOString(),
                membershipRole,
                personalDataAnonymized: true,
                financialHistoryRetained: true,
              },
            }),
          ),
        });
      }

      await tx.notificationRead.deleteMany({ where: { user_id: id } });
      await tx.pushNotificationSubscription.deleteMany({
        where: { user_id: id },
      });
      await tx.fcmDeviceToken.deleteMany({ where: { user_id: id } });
      await tx.authOtpChallenge.deleteMany({ where: { user_id: id } });
      await tx.aiCommand.deleteMany({ where: { user_id: id } });
      await tx.personalTransaction.deleteMany({ where: { user_id: id } });
      await tx.personalBudget.deleteMany({ where: { user_id: id } });
      await tx.familyMember.deleteMany({ where: { user_id: id } });

      await tx.messMembership.updateMany({
        where: { user_id: id, is_active: true },
        data: { is_active: false, left_at: deletedAt },
      });

      await tx.user.update({
        where: { id },
        data: {
          name: 'Deleted User',
          email: anonymizedEmail,
          phone: null,
          nid_number: null,
          nid_image_url: null,
          nid_image_public_id: null,
          location: null,
          state: null,
          city: null,
          zipcode: null,
          preferred_locale: null,
          firebase_uid: null,
          password_hash: invalidPasswordHash,
          avatar_url: null,
          avatar_public_id: null,
          is_active: false,
          is_verified: false,
          ai_free_commands_used: 0,
          otp: null,
          otp_expiry: null,
          deleted_at: deletedAt,
        },
      });
    });

    const profileImageId =
      user.avatar_public_id ?? this.cloudinaryPublicIdFromUrl(user.avatar_url);
    const nidImageId =
      user.nid_image_public_id ??
      this.cloudinaryPublicIdFromUrl(user.nid_image_url);
    await Promise.all([
      profileImageId ? deleteFromCloudinary(profileImageId) : Promise.resolve(),
      nidImageId ? deleteFromCloudinary(nidImageId) : Promise.resolve(),
      user.firebase_uid
        ? this.firebaseAuthService
            .deleteUser(user.firebase_uid)
            .catch((error) => {
              console.error('Firebase account deletion failed:', error);
            })
        : Promise.resolve(),
    ]);

    return {
      deletedAt,
      personalDataAnonymized: true,
      financialHistoryRetained: true,
    };
  }

  private cloudinaryPublicIdFromUrl(url: string | null): string | null {
    if (!url) return null;
    try {
      const path = new URL(url).pathname;
      const uploadMarker = '/upload/';
      const markerIndex = path.indexOf(uploadMarker);
      if (markerIndex < 0) return null;
      const uploadPath = decodeURIComponent(
        path.slice(markerIndex + uploadMarker.length),
      );
      const withoutVersion = uploadPath.replace(/^v\d+\//, '');
      return withoutVersion.replace(/\.[^/.]+$/, '') || null;
    } catch {
      return null;
    }
  }
}
