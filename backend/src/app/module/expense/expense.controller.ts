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

  @Post()
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @UseInterceptors(FileInterceptor('receipt', uploadConfig))
  @ApiOperation({ summary: 'Create an expense with optional receipt image/PDF' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['messId', 'category', 'amount', 'expenseDate'],
      properties: {
        messId: { type: 'string' },
        buyerId: { type: 'string' },
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
  @ApiOperation({ summary: 'Update an expense with optional receipt image/PDF' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        buyerId: { type: 'string' },
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
