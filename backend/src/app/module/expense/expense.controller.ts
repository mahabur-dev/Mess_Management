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
import { ExpenseService } from './expense.service';
import {
  CreateExpenseDto,
  ExpenseFilterDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import AuthGuard from '../../middlewares/auth.guard';

@ApiTags('Expense')
@ApiBearerAuth('access-token')
@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Create an expense (Manager/Admin)' })
  async create(@Req() req: Request, @Body() dto: CreateExpenseDto) {
    const data = await this.expenseService.create(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Expense created successfully', data };
  }

  @Get()
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Get all expenses' })
  async findAll(@Query() query: ExpenseFilterDto) {
    const result = await this.expenseService.findAll(query);
    return {
      message: 'Expenses fetched successfully',
      meta: result.meta,
      totalAmount: result.totalAmount,
      data: result.data,
    };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get expenses for a specific mess' })
  async findByMess(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: ExpenseFilterDto,
  ) {
    const result = await this.expenseService.findByMess(
      messId,
      req.user!.id,
      req.user!.role,
      query,
    );
    return {
      message: 'Expenses fetched successfully',
      meta: result.meta,
      totalAmount: result.totalAmount,
      data: result.data,
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Get an expense by ID' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const data = await this.expenseService.findOne(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Expense fetched successfully', data };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Update an expense (Manager/Admin)' })
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateExpenseDto,
  ) {
    const data = await this.expenseService.update(
      id,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Expense updated successfully', data };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Delete an expense (Manager/Admin)' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const data = await this.expenseService.remove(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Expense deleted successfully', data };
  }
}
