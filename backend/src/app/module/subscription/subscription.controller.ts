import {
  Body,
  Controller,
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
import { SubscriptionService } from './subscription.service';
import {
  CreateSubscriptionDto,
  SubscriptionFilterDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto';
import AuthGuard from '../../middlewares/auth.guard';

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plan info with prices' })
  getPlans() {
    return {
      message: 'Subscription plans fetched successfully',
      data: this.subscriptionService.getAllPlanInfo(),
    };
  }

  @Post()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Create a subscription for a mess' })
  async create(@Body() dto: CreateSubscriptionDto) {
    const data = await this.subscriptionService.create(dto);
    return { message: 'Subscription created successfully', data };
  }

  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all subscriptions with pagination' })
  async findAll(@Query() query: SubscriptionFilterDto) {
    const result = await this.subscriptionService.findAll(query);
    return {
      message: 'Subscriptions fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER', 'MEMBER'))
  @ApiOperation({ summary: 'Get subscription for a specific mess' })
  async findByMess(@Param('messId') messId: string) {
    const data = await this.subscriptionService.findByMess(messId);
    return { message: 'Subscription fetched successfully', data };
  }

  @Get(':id')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get a subscription by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.subscriptionService.findOne(id);
    return { message: 'Subscription fetched successfully', data };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Update a subscription' })
  async update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    const data = await this.subscriptionService.update(id, dto);
    return { message: 'Subscription updated successfully', data };
  }

  @Post('check-expired')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Check and update expired subscriptions' })
  async checkExpired() {
    const result = await this.subscriptionService.checkAndUpdateExpired();
    return { message: 'Expired subscriptions checked', data: result };
  }

  @Post(':messId/trial')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: 'Initialize trial subscription for a mess' })
  async initializeTrial(@Param('messId') messId: string) {
    const data = await this.subscriptionService.initializeTrial(messId);
    return { message: 'Trial subscription initialized', data };
  }
}