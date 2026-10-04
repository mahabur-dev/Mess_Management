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
import { MonthlyBillService } from './monthly-bill.service';
import {
  BillFilterDto,
  BillCloseRequestFilterDto,
  GenerateBillDto,
  ReviewBillCloseRequestDto,
  UpdateBillStatusDto,
} from './dto/monthly-bill.dto';
import AuthGuard from '../../middlewares/auth.guard';
import { MonthlyBillReconciliationService } from './monthly-bill-reconciliation.service';

@ApiTags('Monthly Bill')
@ApiBearerAuth('access-token')
@Controller('monthly-bill')
export class MonthlyBillController {
  constructor(
    private readonly monthlyBillService: MonthlyBillService,
    private readonly billReconciliation: MonthlyBillReconciliationService,
  ) {}

  private withoutMemberContact<
    T extends {
      member?: {
        id: string;
        name: string;
        avatar_url?: string | null;
      } | null;
    },
  >(bill: T) {
    return {
      ...bill,
      member: bill.member
        ? {
            id: bill.member.id,
            name: bill.member.name,
            avatar_url: bill.member.avatar_url ?? null,
          }
        : bill.member,
    };
  }

  @Post('generate')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({
    summary: 'Generate monthly bills for a mess (Manager/Admin)',
  })
  async generate(@Req() req: Request, @Body() dto: GenerateBillDto) {
    const data = await this.monthlyBillService.generate(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Monthly bills generated successfully', data };
  }

  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all monthly bills' })
  async findAll(@Query() query: BillFilterDto) {
    const result = await this.monthlyBillService.findAll(query);
    return {
      message: 'Monthly bills fetched successfully',
      meta: result.meta,
      data: result.data.map((bill) => this.withoutMemberContact(bill)),
    };
  }

  @Get('my')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get my monthly bills' })
  async findMyBills(@Req() req: Request, @Query() query: BillFilterDto) {
    const result = await this.monthlyBillService.findMyBills(
      req.user!.id,
      query,
    );
    return {
      message: 'Your bills fetched successfully',
      meta: result.meta,
      data: result.data.map((bill) => this.withoutMemberContact(bill)),
    };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get monthly bills for a specific mess' })
  async findByMess(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: BillFilterDto,
  ) {
    const result = await this.monthlyBillService.findByMess(
      messId,
      req.user!.id,
      req.user!.role,
      query,
    );
    const billing = query.month
      ? await this.billReconciliation.ensureScheduled(messId, query.month)
      : null;
    return {
      message: 'Monthly bills fetched successfully',
      meta: result.meta,
      data: result.data.map((bill) => this.withoutMemberContact(bill)),
      billing: billing
        ? {
            status: billing.status,
            requestedAt: billing.requested_at,
            calculatedAt: billing.calculated_at,
          }
        : null,
    };
  }

  @Get('close-requests/managed')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get bill close requests managed by this user' })
  async findManagedCloseRequests(
    @Req() req: Request,
    @Query() query: BillCloseRequestFilterDto,
  ) {
    const data = await this.monthlyBillService.findManagedCloseRequests(
      req.user!.id,
      req.user!.role,
      query,
    );
    return { message: 'Bill close requests fetched successfully', data };
  }

  @Post(':id/close-request')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Request settlement of a completed monthly bill' })
  async requestClose(@Param('id') id: string, @Req() req: Request) {
    const data = await this.monthlyBillService.requestClose(
      id,
      req.user!.id,
    );
    return { message: 'Bill close request submitted successfully', data };
  }

  @Patch('close-requests/:requestId/review')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Approve or reject a bill close request' })
  async reviewCloseRequest(
    @Param('requestId') requestId: string,
    @Req() req: Request,
    @Body() dto: ReviewBillCloseRequestDto,
  ) {
    const data = await this.monthlyBillService.reviewCloseRequest(
      requestId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: `Bill close request ${dto.status.toLowerCase()}`, data };
  }

  @Get(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get a monthly bill by ID' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const data = await this.monthlyBillService.findOne(
      id,
      req.user!.id,
      req.user!.role,
    );
    return {
      message: 'Monthly bill fetched successfully',
      data: this.withoutMemberContact(data),
    };
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Update bill status (Manager/Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateBillStatusDto,
  ) {
    const data = await this.monthlyBillService.updateStatus(
      id,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Bill status updated successfully', data };
  }
}
