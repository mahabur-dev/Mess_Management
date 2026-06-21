import { HttpException, Injectable } from '@nestjs/common';
import { ContactRequestSource, Prisma } from '@prisma/client';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import pick from 'src/app/helpers/pick';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ContactRequestFilterDto, CreateContactRequestDto, ReviewContactRequestDto } from './dto/contact-request.dto';

@Injectable()
export class ContactRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private readonly contactSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    description: true,
    source: true,
    requested_plan: true,
    status: true,
    admin_note: true,
    reviewed_by: true,
    reviewed_at: true,
    created_at: true,
    updated_at: true,
    reviewer: { select: { id: true, name: true, email: true } },
  } as const;

  async create(dto: CreateContactRequestDto) {
    const request = await this.prisma.contactRequest.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        description: dto.description.trim(),
        source: dto.source ?? ContactRequestSource.CONTACT,
        requested_plan: dto.requestedPlan ?? null,
      },
      select: this.contactSelect,
    });

    const adminUserIds = await this.notificationService.resolveAdminUserIds();
    const planLabel =
      request.requested_plan === 'MONTHLY'
        ? 'monthly plan'
        : request.requested_plan === 'YEARLY'
          ? 'yearly plan'
          : 'contact request';

    await this.notificationService.sendPushToUsers(adminUserIds, {
      title: 'New contact request',
      body: `${request.name} submitted a ${planLabel}.`,
      url: '/dashboard/contact-requests',
      data: {
        source: request.source,
        contactRequestId: request.id,
        requestedPlan: request.requested_plan,
      },
    });

    return request;
  }

  async findAll(query: ContactRequestFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(paginationOptions);

    const where: Prisma.ContactRequestWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.source) where.source = query.source;
    if (query.searchTerm) {
      where.OR = [
        { name: { contains: query.searchTerm, mode: 'insensitive' } },
        { email: { contains: query.searchTerm, mode: 'insensitive' } },
        { phone: { contains: query.searchTerm, mode: 'insensitive' } },
        { description: { contains: query.searchTerm, mode: 'insensitive' } },
      ];
    }

    const [total, requests] = await Promise.all([
      this.prisma.contactRequest.count({ where }),
      this.prisma.contactRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: this.contactSelect,
      }),
    ]);

    return {
      data: requests,
      meta: buildMeta(total, page, limit),
    };
  }

  async review(id: string, adminId: string, dto: ReviewContactRequestDto) {
    const request = await this.prisma.contactRequest.findUnique({ where: { id } });
    if (!request) throw new HttpException('Contact request not found', 404);

    return this.prisma.contactRequest.update({
      where: { id },
      data: {
        status: dto.status,
        admin_note: dto.adminNote?.trim() || request.admin_note,
        reviewed_by: adminId,
        reviewed_at: new Date(),
      },
      select: this.contactSelect,
    });
  }
}
