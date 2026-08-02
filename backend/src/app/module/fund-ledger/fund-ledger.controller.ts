import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import {
  CreateCollectedFundDto,
  FundLedgerFilterDto,
} from './dto/fund-ledger.dto';
import { FundLedgerService } from './fund-ledger.service';

@ApiTags('Fund Ledger')
@ApiBearerAuth('access-token')
@Controller('funds')
export class FundLedgerController {
  constructor(private readonly fundLedgerService: FundLedgerService) {}

  @Get(':messId/balances')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({
    summary: 'Get current mess-deposit and collected-fund balances',
  })
  async balances(@Param('messId') messId: string, @Req() req: Request) {
    const data = await this.fundLedgerService.getBalances(
      messId,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Fund balances fetched successfully', data };
  }

  @Get(':messId/collected')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'List collected-fund credits' })
  async listCollected(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: FundLedgerFilterDto,
  ) {
    const result = await this.fundLedgerService.listCollectedFund(
      messId,
      req.user!.id,
      req.user!.role,
      query,
    );
    return {
      message: 'Collected fund entries fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Post('collected')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Record a collected-fund credit' })
  async createCollected(
    @Req() req: Request,
    @Body() dto: CreateCollectedFundDto,
  ) {
    const data = await this.fundLedgerService.createCollectedFund(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Collected fund recorded successfully', data };
  }

  @Delete('collected/:id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Remove an unspent collected-fund credit' })
  async removeCollected(@Param('id') id: string, @Req() req: Request) {
    const data = await this.fundLedgerService.removeCollectedFund(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Collected fund entry removed successfully', data };
  }
}
