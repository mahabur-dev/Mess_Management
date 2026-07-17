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
  SavePushSubscriptionDto,
  SendPushNotificationDto,
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

  @Get('push/public-key')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get browser push notification public key' })
  async getPushPublicKey() {
    const data = this.notificationService.getPushPublicKey();
    return { message: 'Push public key fetched successfully', data };
  }

  @Get('push/status')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get current user push subscription status' })
  async getPushStatus(@Req() req: Request) {
    const data = await this.notificationService.getPushSubscriptionStatus(req.user!.id);
    return { message: 'Push subscription status fetched successfully', data };
  }

  @Post('push/subscribe')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Save current user browser push subscription' })
  async savePushSubscription(
    @Req() req: Request,
    @Body() dto: SavePushSubscriptionDto,
  ) {
    const data = await this.notificationService.savePushSubscription(
      req.user!.id,
      dto,
    );
    return { message: data.message, data: data.subscription };
  }

  @Patch('push/unsubscribe')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Disable current user browser push subscription' })
  async removePushSubscription(
    @Req() req: Request,
    @Body('endpoint') endpoint: string,
  ) {
    return this.notificationService.removePushSubscription(req.user!.id, endpoint);
  }

  @Post('push/send/user/:userId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Send browser push notification to one user' })
  async sendPushToUser(
    @Param('userId') userId: string,
    @Body() dto: SendPushNotificationDto,
  ) {
    const data = await this.notificationService.sendPushToUser(userId, dto);
    return { message: data.message, data };
  }

  @Post('push/send/all')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: 'Send browser push notification to every active user' })
  async sendPushToAll(@Body() dto: SendPushNotificationDto) {
    const data = await this.notificationService.sendPushToAll(dto);
    return { message: data.message, data };
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

  @Get('my')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get notifications visible to current user' })
  async findMine(@Req() req: Request, @Query() query: NotificationFilterDto) {
    const result = await this.notificationService.findMine(
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

  @Get('unread-count')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get current user unread notification count' })
  async getUnreadCount(@Req() req: Request) {
    const data = await this.notificationService.getUnreadCount(
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Unread notification count fetched successfully', data };
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
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Delete a notification for current user, or globally for admin' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const data = await this.notificationService.remove(
      id,
      req.user!.id,
      req.user!.role,
    );
    return data;
  }
}
