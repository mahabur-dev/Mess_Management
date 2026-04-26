import { HttpException, Injectable } from '@nestjs/common';
import {
  UpdateUserDto,
  UpdateUserStatusDto,
  UserFilterDto,
} from './dto/user.dto';
import type { UserWhereInput } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { deleteFromCloudinary, uploadToCloudinary } from 'src/app/helpers/fileUploder';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────
  // Get all users (Admin only)
  // ─────────────────────────────────────────
  async findAll(query: UserFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(paginationOptions as any);

    const where: UserWhereInput = {};

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
          profileImage: true,
          mobileNumber: true,
          city: true,
          state: true,
          country: true,
          postcode: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
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
        profileImage: true,
        mobileNumber: true,
        city: true,
        state: true,
        country: true,
        postcode: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        messMembers: {
          select: {
            joinedAt: true,
            mess: {
              select: { id: true, messName: true, messLocation: true },
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
    file?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', 404);

    let profileImage = user.profileImage;
    let publicId = user.publicId;

    if (file) {
      // Delete old image from Cloudinary
      if (user.publicId) await deleteFromCloudinary(user.publicId);

      const uploaded = await uploadToCloudinary(file, 'mess_management/profiles');
      profileImage = uploaded.url;
      publicId = uploaded.public_id;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        profileImage,
        publicId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        mobileNumber: true,
        city: true,
        state: true,
        country: true,
        postcode: true,
        createdAt: true,
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
      data: { isActive: dto.isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });

    return updated;
  }

  // ─────────────────────────────────────────
  // Admin: delete user
  // ─────────────────────────────────────────
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpException('User not found', 404);

    if (user.publicId) await deleteFromCloudinary(user.publicId);

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}