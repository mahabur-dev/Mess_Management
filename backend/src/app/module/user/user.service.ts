import { HttpException, Injectable } from '@nestjs/common';
import {
  UpdateUserDto,
  UpdateUserStatusDto,
  UserFilterDto,
} from './dto/user.dto';
import { Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { uploadToCloudinary } from 'src/app/helpers/fileUploder';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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

    const where: Prisma.UserWhereInput = {};

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
    }

    if (nidImage) {
      const uploaded = await uploadToCloudinary(
        nidImage,
        'mess_management/identity-documents',
        { allowedTypes: ['image'], maxSizeBytes: 5 * 1024 * 1024 },
      );
      nid_image_url = uploaded.url;
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
        location: nullableText(dto.location),
        state: nullableText(dto.state),
        city: nullableText(dto.city),
        zipcode: nullableText(dto.zipcode),
        preferred_locale: dto.preferredLocale,
        avatar_url,
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
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpException('User not found', 404);

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}
