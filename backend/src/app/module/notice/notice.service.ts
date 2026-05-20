import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNoticeDto, NoticeFilterDto, UpdateNoticeDto } from './dto/notice.dto';

@Injectable()
export class NoticeService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.notice.create({
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
