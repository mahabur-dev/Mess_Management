import { HttpException, Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import pick from 'src/app/helpers/pick';
import paginationHelper, { buildMeta } from 'src/app/helpers/pagenation';
import { PrismaService } from 'src/prisma/prisma.service';
import { ComplaintFilterDto, CreateComplaintDto, UpdateComplaintStatusDto } from './dto/complaint.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ComplaintService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private readonly complaintSelect = {
    id: true,
    category: true,
    title: true,
    description: true,
    status: true,
    response: true,
    created_at: true,
    updated_at: true,
    mess: { select: { id: true, name: true } },
    member: { select: { id: true, name: true, email: true } },
    statusUpdater: { select: { id: true, name: true, email: true } },
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
    throw new HttpException('Forbidden: Only managers can update complaints', 403);
  }

  async create(userId: string, role: string, dto: CreateComplaintDto) {
    await this.verifyMessMember(dto.messId, userId, role);
    const complaint = await this.prisma.complaint.create({
      data: {
        mess_id: dto.messId,
        member_id: userId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
      },
      select: this.complaintSelect,
    });

    const targetUserIds = (
      await this.notificationService.resolveMessManagerAndAdminUserIds(
        dto.messId,
      )
    ).filter((targetUserId) => targetUserId !== userId);

    await this.notificationService.createForMess(
      userId,
      dto.messId,
      NotificationType.ANNOUNCEMENT,
      `New complaint: ${dto.title}`,
      dto.description,
      {
        source: 'COMPLAINT',
        complaintId: complaint.id,
        category: dto.category,
      },
      targetUserIds,
      '/dashboard/notifications',
    );

    return complaint;
  }

  async findAll(query: ComplaintFilterDto) {
    const paginationOptions = pick(query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper(paginationOptions);
    const where = this.buildWhere(query);
    const [total, complaints] = await Promise.all([
      this.prisma.complaint.count({ where }),
      this.prisma.complaint.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder }, select: this.complaintSelect }),
    ]);
    return { data: complaints, meta: buildMeta(total, page, limit) };
  }

  async findByMess(messId: string, userId: string, role: string, query: ComplaintFilterDto) {
    await this.verifyMessMember(messId, userId, role);
    return this.findAll({ ...query, messId });
  }

  async findMyComplaints(userId: string, query: ComplaintFilterDto) {
    return this.findAll({ ...query, memberId: userId });
  }

  async updateStatus(id: string, userId: string, role: string, dto: UpdateComplaintStatusDto) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new HttpException('Complaint not found', 404);
    await this.verifyManager(complaint.mess_id, userId, role);
    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: dto.status,
        response: dto.response,
        updated_by: userId,
      },
      select: this.complaintSelect,
    });
  }

  async remove(id: string, userId: string, role: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new HttpException('Complaint not found', 404);

    await this.verifyManager(complaint.mess_id, userId, role);
    await this.prisma.complaint.delete({ where: { id } });

    return { message: 'Complaint deleted successfully' };
  }

  private buildWhere(query: ComplaintFilterDto): Prisma.ComplaintWhereInput {
    const where: Prisma.ComplaintWhereInput = {};
    if (query.messId) where.mess_id = query.messId;
    if (query.memberId) where.member_id = query.memberId;
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    return where;
  }
}
