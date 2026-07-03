import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ExpenseCategory, ExpensePaymentType } from '@prisma/client';

export class CreateExpenseDto {
  @ApiProperty({ example: 'uuid-mess-id', description: 'Mess ID' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiPropertyOptional({ example: 'uuid-buyer-id' })
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiPropertyOptional({ example: 'uuid-member-id', description: 'Member who purchased this expense' })
  @IsOptional()
  @IsString()
  purchasedBy?: string;

  @ApiProperty({ enum: ExpenseCategory, example: ExpenseCategory.GROCERY })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ example: 1200.5, description: 'Expense amount' })
  @Transform(({ value }) =>
    value === undefined || value === null || value === '' ? undefined : Number(value),
  )
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Rice' })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === '' ? undefined : Number(value),
  )
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: '2025-04-26', description: 'Date of expense' })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional({ example: 'Monthly grocery run' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/receipt.jpg' })
  @IsOptional()
  @IsUrl()
  receiptUrl?: string;

  @ApiPropertyOptional({ enum: ExpensePaymentType, example: ExpensePaymentType.FROM_DEPOSIT, description: 'FROM_DEPOSIT (split among members) or PERSONAL (adds to member deposit)' })
  @IsOptional()
  @IsEnum(ExpensePaymentType)
  paymentType?: ExpensePaymentType;
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({ example: 'uuid-buyer-id' })
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiPropertyOptional({ example: 'uuid-member-id', description: 'Member who purchased this expense' })
  @IsOptional()
  @IsString()
  purchasedBy?: string;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === '' ? undefined : Number(value),
  )
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ example: 'Rice' })
  @IsOptional()
  @IsString()
  itemName?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === '' ? undefined : Number(value),
  )
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: '2025-04-28' })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/new.jpg' })
  @IsOptional()
  @IsUrl()
  receiptUrl?: string;

  @ApiPropertyOptional({ enum: ExpensePaymentType, description: 'FROM_DEPOSIT or PERSONAL' })
  @IsOptional()
  @IsEnum(ExpensePaymentType)
  paymentType?: ExpensePaymentType;
}

export class RequestPriceReviewDto {
  @ApiProperty({ example: 'Please review the rice price and update the correct amount.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class ExpenseFilterDto {
  @ApiPropertyOptional({ description: 'Filter by mess ID' })
  @IsOptional()
  @IsString()
  messId?: string;

  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  userName?: string

  @ApiPropertyOptional({ example: '2025-04-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-04-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  limit?: string;

  @ApiPropertyOptional({ example: 'expense_date' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
