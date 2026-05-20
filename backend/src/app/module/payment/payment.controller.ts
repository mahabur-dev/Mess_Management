import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { CreatePaymentDto, PaymentFilterDto, ReviewPaymentDto } from './dto/payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('Payment')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Submit a payment with transaction info/screenshot' })
  async create(@Req() req: Request, @Body() dto: CreatePaymentDto) {
    const data = await this.paymentService.create(req.user!.id, req.user!.role, dto);
    return { message: 'Payment submitted successfully', data };
  }

  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all payments' })
  async findAll(@Query() query: PaymentFilterDto) {
    const result = await this.paymentService.findAll(query);
    return { message: 'Payments fetched successfully', meta: result.meta, totalAmount: result.totalAmount, data: result.data };
  }

  @Get('my')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get my payment history' })
  async findMyPayments(@Req() req: Request, @Query() query: PaymentFilterDto) {
    const result = await this.paymentService.findMyPayments(req.user!.id, query);
    return { message: 'Your payments fetched successfully', meta: result.meta, totalAmount: result.totalAmount, data: result.data };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get payments for a mess' })
  async findByMess(@Param('messId') messId: string, @Req() req: Request, @Query() query: PaymentFilterDto) {
    const result = await this.paymentService.findByMess(messId, req.user!.id, req.user!.role, query);
    return { message: 'Payments fetched successfully', meta: result.meta, totalAmount: result.totalAmount, data: result.data };
  }

  @Patch(':id/review')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Approve or reject a payment' })
  async review(@Param('id') id: string, @Req() req: Request, @Body() dto: ReviewPaymentDto) {
    const data = await this.paymentService.review(id, req.user!.id, req.user!.role, dto);
    return { message: `Payment ${dto.status.toLowerCase()} successfully`, data };
  }
}
