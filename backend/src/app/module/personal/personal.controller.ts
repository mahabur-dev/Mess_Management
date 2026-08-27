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
import AuthGuard from '../../middlewares/auth.guard';
import {
  CreateFamilyMemberDto,
  CreatePersonalBudgetDto,
  CreatePersonalTransactionDto,
  PersonalMonthQueryDto,
  PersonalTransactionFilterDto,
  UpdateFamilyMemberDto,
  UpdatePersonalBudgetDto,
  UpdatePersonalTransactionDto,
} from './dto/personal.dto';
import { PersonalService } from './personal.service';

@ApiTags('Personal Finance')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
@Controller('personal')
export class PersonalController {
  constructor(private readonly personalService: PersonalService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get personal monthly dashboard summary' })
  async summary(@Req() req: Request, @Query() query: PersonalMonthQueryDto) {
    const data = await this.personalService.getSummary(
      req.user!.id,
      query.month,
    );
    return { message: 'Personal summary fetched successfully', data };
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get basic personal monthly report' })
  async reports(@Req() req: Request, @Query() query: PersonalMonthQueryDto) {
    const data = await this.personalService.getReports(
      req.user!.id,
      query.month,
    );
    return { message: 'Personal report fetched successfully', data };
  }

  @Get('transactions')
  async transactions(
    @Req() req: Request,
    @Query() query: PersonalTransactionFilterDto,
  ) {
    const result = await this.personalService.findTransactions(
      req.user!.id,
      query,
    );
    return { message: 'Personal transactions fetched successfully', ...result };
  }

  @Post('transactions')
  async createTransaction(
    @Req() req: Request,
    @Body() dto: CreatePersonalTransactionDto,
  ) {
    const data = await this.personalService.createPersonalTransaction(
      req.user!.id,
      dto,
    );
    return { message: 'Personal transaction created successfully', data };
  }

  @Patch('transactions/:id')
  async updateTransaction(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdatePersonalTransactionDto,
  ) {
    const data = await this.personalService.updateTransaction(
      req.user!.id,
      id,
      dto,
    );
    return { message: 'Personal transaction updated successfully', data };
  }

  @Delete('transactions/:id')
  removeTransaction(@Req() req: Request, @Param('id') id: string) {
    return this.personalService.removeTransaction(req.user!.id, id);
  }

  @Get('family-members')
  async familyMembers(
    @Req() req: Request,
    @Query() query: PersonalMonthQueryDto,
  ) {
    const data = await this.personalService.findFamilyMembers(
      req.user!.id,
      query.month,
    );
    return { message: 'Family members fetched successfully', data };
  }

  @Post('family-members')
  async createFamilyMember(
    @Req() req: Request,
    @Body() dto: CreateFamilyMemberDto,
  ) {
    const data = await this.personalService.createFamilyMember(
      req.user!.id,
      dto,
    );
    return { message: 'Family member created successfully', data };
  }

  @Patch('family-members/:id')
  async updateFamilyMember(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateFamilyMemberDto,
  ) {
    const data = await this.personalService.updateFamilyMember(
      req.user!.id,
      id,
      dto,
    );
    return { message: 'Family member updated successfully', data };
  }

  @Delete('family-members/:id')
  removeFamilyMember(@Req() req: Request, @Param('id') id: string) {
    return this.personalService.removeFamilyMember(req.user!.id, id);
  }

  @Get('budgets')
  async budgets(@Req() req: Request, @Query() query: PersonalMonthQueryDto) {
    const data = await this.personalService.findBudgets(
      req.user!.id,
      query.month,
    );
    return { message: 'Personal budgets fetched successfully', data };
  }

  @Post('budgets')
  async createBudget(
    @Req() req: Request,
    @Body() dto: CreatePersonalBudgetDto,
  ) {
    const data = await this.personalService.createBudget(req.user!.id, dto);
    return { message: 'Personal budget created successfully', data };
  }

  @Patch('budgets/:id')
  async updateBudget(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdatePersonalBudgetDto,
  ) {
    const data = await this.personalService.updateBudget(req.user!.id, id, dto);
    return { message: 'Personal budget updated successfully', data };
  }

  @Delete('budgets/:id')
  removeBudget(@Req() req: Request, @Param('id') id: string) {
    return this.personalService.removeBudget(req.user!.id, id);
  }
}
