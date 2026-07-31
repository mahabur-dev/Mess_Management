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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ExpenseService } from './expense.service';
import {
  CreateExpenseDto,
  ExpenseFilterDto,
  ExpensePreviewDto,
  RequestPriceReviewDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import AuthGuard from '../../middlewares/auth.guard';
import { uploadConfig } from 'src/app/helpers/fileUploder';

@ApiTags('Expense')
@ApiBearerAuth('access-token')
@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post('preview')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Preview expense split without saving' })
  async preview(@Req() req: Request, @Body() dto: ExpensePreviewDto) {
    const data = await this.expenseService.preview(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Expense split preview calculated successfully', data };
  }

  @Get('summary')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({
    summary: 'Expense & Utility Center summary for current user',
  })
  async summary(
    @Req() req: Request,
    @Query('messId') messId: string,
    @Query('month') month?: string,
  ) {
    const data = await this.expenseService.getSummary(
      messId,
      req.user!.id,
      req.user!.role,
      month ?? new Date().toISOString().slice(0, 10),
    );
    return { message: 'Expense summary fetched successfully', data };
  }

  @Get('my-details')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({
    summary: 'Logged-in member monthly allocated expense details',
  })
  async myDetails(
    @Req() req: Request,
    @Query('messId') messId: string,
    @Query('month') month?: string,
  ) {
    const data = await this.expenseService.getMyDetails(
      messId,
      req.user!.id,
      req.user!.role,
      month ?? new Date().toISOString().slice(0, 10),
    );
    return { message: 'My expense details fetched successfully', data };
  }

  @Get('manager/members')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Manager member-wise monthly expense overview' })
  async managerMembers(
    @Req() req: Request,
    @Query('messId') messId: string,
    @Query('month') month?: string,
  ) {
    const data = await this.expenseService.getManagerMemberExpenses(
      messId,
      req.user!.id,
      req.user!.role,
      month ?? new Date().toISOString().slice(0, 10),
    );
    return { message: 'Member expense overview fetched successfully', data };
  }

  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @UseInterceptors(FileInterceptor('receipt', uploadConfig))
  @ApiOperation({
    summary: 'Create an expense with optional receipt image/PDF',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['messId', 'category', 'amount', 'expenseDate'],
      properties: {
        messId: { type: 'string' },
        buyerId: { type: 'string' },
        purchasedBy: { type: 'string' },
        category: { type: 'string' },
        amount: { type: 'number' },
        itemName: { type: 'string' },
        quantity: { type: 'number' },
        unit: { type: 'string' },
        expenseDate: { type: 'string', format: 'date' },
        description: { type: 'string' },
        receiptUrl: { type: 'string' },
        paidFrom: {
          type: 'string',
          enum: ['PERSONAL', 'MESS_DEPOSIT', 'FROM_DEPOSIT', 'COLLECTED_FUND'],
        },
        usedBy: {
          type: 'string',
          enum: [
            'SELF_ONLY',
            'SELECTED_MEMBERS',
            'ALL_MEMBERS',
            'MEAL_ON_MEMBERS',
          ],
        },
        splitMethod: {
          type: 'string',
          enum: ['EQUAL', 'MEAL_COUNT', 'CUSTOM'],
        },
        selectedMemberIds: { type: 'array', items: { type: 'string' } },
        customShares: { type: 'array', items: { type: 'object' } },
        receipt: { type: 'string', format: 'binary' },
      },
    },
  })
  async create(
    @Req() req: Request,
    @Body() dto: CreateExpenseDto,
    @UploadedFile() receipt?: Express.Multer.File,
  ) {
    const data = await this.expenseService.create(
      req.user!.id,
      req.user!.role,
      dto,
      receipt,
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
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
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
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get an expense by ID' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const data = await this.expenseService.findOne(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Expense fetched successfully', data };
  }

  @Post(':id/request-price-review')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
  @ApiOperation({ summary: 'Request price review from the expense creator' })
  async requestPriceReview(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: RequestPriceReviewDto,
  ) {
    const data = await this.expenseService.requestPriceReview(
      id,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Price review request sent successfully', data };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @UseInterceptors(FileInterceptor('receipt', uploadConfig))
  @ApiOperation({
    summary: 'Update an expense with optional receipt image/PDF',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        buyerId: { type: 'string' },
        purchasedBy: { type: 'string' },
        category: { type: 'string' },
        amount: { type: 'number' },
        itemName: { type: 'string' },
        quantity: { type: 'number' },
        unit: { type: 'string' },
        expenseDate: { type: 'string', format: 'date' },
        description: { type: 'string' },
        receiptUrl: { type: 'string' },
        receipt: { type: 'string', format: 'binary' },
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: UpdateExpenseDto,
    @UploadedFile() receipt?: Express.Multer.File,
  ) {
    const data = await this.expenseService.update(
      id,
      req.user!.id,
      req.user!.role,
      dto,
      receipt,
    );
    return { message: 'Expense updated successfully', data };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER'))
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
