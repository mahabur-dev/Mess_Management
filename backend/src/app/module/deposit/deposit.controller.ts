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
import { DepositService } from './deposit.service';
import {
  CreateDepositDto,
  DepositFilterDto,
  UpdateDepositDto,
} from './dto/deposit.dto';
import AuthGuard from '../../middlewares/auth.guard';

@ApiTags('Deposit')
@ApiBearerAuth('access-token')
@Controller('deposit')
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Add a deposit (all roles)' })
  async create(@Req() req: Request, @Body() dto: CreateDepositDto) {
    const data = await this.depositService.create(
      req.user!.id, req.user!.role, dto,
    );
    return { message: 'Deposit added successfully', data };
  }

  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all deposits' })
  async findAll(@Query() query: DepositFilterDto) {
    const result = await this.depositService.findAll(query);
    return {
      message: 'Deposits fetched successfully',
      meta: result.meta,
      data: result.data,
      totalAmount: result.totalAmount,
    };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get deposits for a specific mess' })
  async findByMess(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: DepositFilterDto,
  ) {
    const result = await this.depositService.findByMess(
      messId, req.user!.id, req.user!.role, query,
    );
    return {
      message: 'Deposits fetched successfully',
      meta: result.meta,
      data: result.data,
      totalAmount: result.totalAmount,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get a deposit by ID' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const data = await this.depositService.findOne(
      id, req.user!.id, req.user!.role,
    );
    return { message: 'Deposit fetched successfully', data };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Update a deposit' })
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateDepositDto,
  ) {
    const data = await this.depositService.update(
      id, req.user!.id, req.user!.role, dto,
    );
    return { message: 'Deposit updated successfully', data };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Delete a deposit' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const data = await this.depositService.remove(
      id, req.user!.id, req.user!.role,
    );
    return { message: 'Deposit deleted successfully', data };
  }
}