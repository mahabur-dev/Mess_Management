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
  GenerateBillDto,
  UpdateBillStatusDto,
} from './dto/monthly-bill.dto';
import AuthGuard from '../../middlewares/auth.guard';

@ApiTags('Monthly Bill')
@ApiBearerAuth('access-token')
@Controller('monthly-bill')
export class MonthlyBillController {
  constructor(private readonly monthlyBillService: MonthlyBillService) {}

  @Post('generate')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Generate monthly bills for a mess (Manager/Admin)' })
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
      data: result.data,
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
      data: result.data,
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
    return {
      message: 'Monthly bills fetched successfully',
      meta: result.meta,
      data: result.data,
    };
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
    return { message: 'Monthly bill fetched successfully', data };
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
