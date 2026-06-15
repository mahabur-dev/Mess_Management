import { HttpException, Injectable } from '@nestjs/common';
import { NotificationType, NoticeType, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNoticeDto, NoticeFilterDto, UpdateNoticeDto } from './dto/notice.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class NoticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private readonly noticeSelect = {
    id: true,
    type: true,
    title: true,
    body: true,
    is_pinned: true,
    created_at: true,
    updated_at: true,
    mess: { select: { id: true, name: true } },
    creator: { select: { id: true, name: true, email: true } },
  } as const;

  private async verifyMessMember(messId: string, userId: string, role: string) {
    if (role === 'ADMIN') return;
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;
    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (!membership?.is_active) throw new HttpException('Forbidden: Not a member of this mess', 403);
  }

  private async verifyManager(messId: string, userId: string, role: string) {
    if (role === 'ADMIN') return;
    const mess = await this.prisma.mess.findUnique({ where: { id: messId } });
    if (!mess) throw new HttpException('Mess not found', 404);
    if (mess.created_by === userId) return;
    const membership = await this.prisma.messMembership.findUnique({
      where: { mess_id_user_id: { mess_id: messId, user_id: userId } },
    });
    if (membership?.is_active && membership.role === 'MANAGER') return;
    throw new HttpException('Forbidden: Only managers can manage notices', 403);
  }

  async create(userId: string, role: string, dto: CreateNoticeDto) {
    await this.verifyManager(dto.messId, userId, role);
    const notice = await this.prisma.notice.create({
      data: {
        mess_id: dto.messId,
        created_by: userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        is_pinned: dto.isPinned ?? false,
      },
      select: this.noticeSelect,
    });

    const targetUserIds = await this.notificationService.resolveMessUserIds(
      dto.messId,
    );

    await this.notificationService.createForMess(
      userId,
      dto.messId,
      this.mapNoticeTypeToNotificationType(dto.type),
      dto.title,
      dto.body,
      {
        source: 'NOTICE',
        noticeId: notice.id,
        noticeType: dto.type,
      },
      targetUserIds,
      '/dashboard/notifications',
    );

    return notice;
  }

  private mapNoticeTypeToNotificationType(type: NoticeType) {
    const map: Record<NoticeType, NotificationType> = {
      MEAL: NotificationType.MEAL_UPDATE,
      PAYMENT: NotificationType.PAYMENT_NOTICE,
      EMERGENCY: NotificationType.EMERGENCY,
      MEETING: NotificationType.MEETING,
      RULE_UPDATE: NotificationType.RULE_UPDATE,
      GENERAL: NotificationType.ANNOUNCEMENT,
    };

    return map[type] ?? NotificationType.ANNOUNCEMENT;
  }

  async findAll(query: NoticeFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(paginationOptions);
    const where: Prisma.NoticeWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.type) where.type = query.type;

    const [total, notices] = await Promise.all([
      this.prisma.notice.count({ where }),
      this.prisma.notice.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ is_pinned: 'desc' }, { [sortBy]: sortOrder }],
        select: this.noticeSelect,
      }),
    ]);

    return { data: notices, meta: buildMeta(total, page, limit) };
  }

  async findByMess(messId: string, userId: string, role: string, query: NoticeFilterDto) {
    await this.verifyMessMember(messId, userId, role);
    return this.findAll({ ...query, messId });
  }

  async update(id: string, userId: string, role: string, dto: UpdateNoticeDto) {
    const notice = await this.prisma.notice.findUnique({ where: { id } });
    if (!notice) throw new HttpException('Notice not found', 404);
    await this.verifyManager(notice.mess_id, userId, role);
    return this.prisma.notice.update({
      where: { id },
      data: {
        type: dto.type,
        title: dto.title,
        body: dto.body,
        is_pinned: dto.isPinned,
      },
      select: this.noticeSelect,
    });
  }

  async remove(id: string, userId: string, role: string) {
    const notice = await this.prisma.notice.findUnique({ where: { id } });
    if (!notice) throw new HttpException('Notice not found', 404);
    await this.verifyManager(notice.mess_id, userId, role);
    await this.prisma.notice.delete({ where: { id } });
    return { message: 'Notice deleted successfully' };
  }
}
