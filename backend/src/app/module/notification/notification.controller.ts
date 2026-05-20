import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  NotificationFilterDto,
} from './dto/notification.dto';
import AuthGuard from '../../middlewares/auth.guard';

@ApiTags('Notification')
@ApiBearerAuth('access-token')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Create a notification (Manager/Admin)' })
  async create(@Req() req: Request, @Body() dto: CreateNotificationDto) {
    const data = await this.notificationService.create(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Notification sent successfully', data };
  }

  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all notifications' })
  async findAll(@Query() query: NotificationFilterDto) {
    const result = await this.notificationService.findAll(query);
    return {
      message: 'Notifications fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get notifications for a specific mess' })
  async findByMess(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: NotificationFilterDto,
  ) {
    const result = await this.notificationService.findByMess(
      messId,
      req.user!.id,
      req.user!.role,
      query,
    );
    return {
      message: 'Notifications fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get a notification by ID' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const data = await this.notificationService.findOne(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Notification fetched successfully', data };
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Param('id') id: string, @Req() req: Request) {
    const data = await this.notificationService.markAsRead(
      id,
      req.user!.id,
      req.user!.role,
    );
    return data;
  }

  @Delete(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Delete a notification (Manager/Admin)' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const data = await this.notificationService.remove(
      id,
      req.user!.id,
      req.user!.role,
    );
    return data;
  }
}
