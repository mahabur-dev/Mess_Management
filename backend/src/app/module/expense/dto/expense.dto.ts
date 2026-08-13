import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ExpenseCategory,
  ExpensePaymentType,
  ExpenseRecordType,
  ExpenseSplitMethod,
  ExpenseUsedBy,
  UtilityType,
} from '@prisma/client';

const PAID_FROM_INPUTS = [
  'PERSONAL',
  'FROM_DEPOSIT',
  'MESS_DEPOSIT',
  'COLLECTED_FUND',
] as const;

function parseStringArray(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;
  const stringValue = value.trim();
  if (stringValue.startsWith('[')) {
    try {
      const parsed = JSON.parse(stringValue);
      return Array.isArray(parsed) ? parsed : value;
    } catch {
      return value;
    }
  }
  return stringValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export class CustomExpenseShareDto {
  @ApiProperty({ example: 'uuid-member-id' })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ example: 300 })
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class ExpenseItemDto {
  @ApiProperty({ example: 'Rice', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  itemName: string;

  @ApiProperty({
    example: 350,
    description: 'Final paid amount for this line item, not a unit price',
  })
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(0.01)
  @Max(9_999_999_999.99)
  amount: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(0)
  @Max(9_999_999.999)
  quantity?: number | null;

  @ApiPropertyOptional({ example: 'kg', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string | null;
}

export class CreateExpenseDto {
  @ApiProperty({ example: 'uuid-mess-id', description: 'Mess ID' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiPropertyOptional({ example: 'uuid-buyer-id' })
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiPropertyOptional({
    example: 'uuid-member-id',
    description: 'Member who purchased this expense',
  })
  @IsOptional()
  @IsString()
  purchasedBy?: string;

  @ApiPropertyOptional({
    enum: ExpenseRecordType,
    example: ExpenseRecordType.EXPENSE,
  })
  @IsOptional()
  @IsIn(Object.values(ExpenseRecordType))
  type?: ExpenseRecordType;

  @ApiProperty({ enum: ExpenseCategory, example: ExpenseCategory.GROCERY })
  @IsIn(Object.values(ExpenseCategory))
  category: ExpenseCategory;

  @ApiPropertyOptional({ enum: UtilityType, example: UtilityType.ELECTRICITY })
  @IsOptional()
  @IsIn(Object.values(UtilityType))
  utilityType?: UtilityType | null;

  @ApiPropertyOptional({
    example: 1200.5,
    description:
      'Legacy single-item amount. For items[], the backend calculates the expense total.',
  })
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @ValidateIf(
    (dto: CreateExpenseDto, value: unknown) =>
      value !== undefined || !Array.isArray(dto.items) || dto.items.length === 0,
  )
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({
    type: [ExpenseItemDto],
    description: 'Purchased line items. Expense total is calculated from these amounts.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemDto)
  items?: ExpenseItemDto[];

  @ApiPropertyOptional({ example: 'Rice' })
  @IsOptional()
  @IsString()
  itemName?: string | null;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(0)
  quantity?: number | null;

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  unit?: string | null;

  @ApiProperty({ example: '2025-04-26', description: 'Date of expense' })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional({
    example: '2026-07-01',
    description: 'First day of billing month',
  })
  @IsOptional()
  @IsDateString()
  billingMonth?: string;

  @ApiPropertyOptional({ example: 'Monthly grocery run' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/receipt.jpg' })
  @IsOptional()
  @IsUrl()
  receiptUrl?: string | null;

  @ApiPropertyOptional({
    enum: PAID_FROM_INPUTS,
    example: 'PERSONAL',
    description: 'PERSONAL, MESS_DEPOSIT/FROM_DEPOSIT, or COLLECTED_FUND',
  })
  @IsOptional()
  @IsIn(PAID_FROM_INPUTS)
  paidFrom?: ExpensePaymentType | 'MESS_DEPOSIT';

  @ApiPropertyOptional({
    enum: ExpensePaymentType,
    example: ExpensePaymentType.FROM_DEPOSIT,
    description: 'Backward-compatible alias for paidFrom',
  })
  @IsOptional()
  @IsIn(Object.values(ExpensePaymentType))
  paymentType?: ExpensePaymentType;

  @ApiPropertyOptional({
    enum: ExpenseUsedBy,
    example: ExpenseUsedBy.ALL_MEMBERS,
  })
  @IsOptional()
  @IsIn(Object.values(ExpenseUsedBy))
  usedBy?: ExpenseUsedBy;

  @ApiPropertyOptional({
    enum: ExpenseSplitMethod,
    example: ExpenseSplitMethod.EQUAL,
  })
  @IsOptional()
  @IsIn(Object.values(ExpenseSplitMethod))
  splitMethod?: ExpenseSplitMethod;

  @ApiPropertyOptional({
    type: [String],
    example: ['uuid-member-id-1', 'uuid-member-id-2'],
  })
  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  selectedMemberIds?: string[];

  @ApiPropertyOptional({ type: [CustomExpenseShareDto] })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomExpenseShareDto)
  customShares?: CustomExpenseShareDto[];
}

export class UpdateExpenseDto {
  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsOptional()
  @IsIn(Object.values(ExpenseCategory))
  category?: ExpenseCategory;

  @ApiPropertyOptional({ enum: ExpenseRecordType })
  @IsOptional()
  @IsIn(Object.values(ExpenseRecordType))
  type?: ExpenseRecordType;

  @ApiPropertyOptional({ enum: UtilityType })
  @IsOptional()
  @IsIn(Object.values(UtilityType))
  utilityType?: UtilityType | null;

  @ApiPropertyOptional({ example: 'uuid-buyer-id' })
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiPropertyOptional({
    example: 'uuid-member-id',
    description: 'Member who purchased this expense',
  })
  @IsOptional()
  @IsString()
  purchasedBy?: string;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === ''
      ? undefined
      : Number(value),
  )
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({
    type: [ExpenseItemDto],
    description: 'Complete replacement set of purchased line items',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemDto)
  items?: ExpenseItemDto[];

  @ApiPropertyOptional({ example: 'Rice' })
  @IsOptional()
  @IsString()
  itemName?: string | null;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Transform(({ value }) =>
    value === null
      ? null
      : value === undefined || value === ''
        ? undefined
        : Number(value),
  )
  @IsNumber()
  @Min(0)
  quantity?: number | null;

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  unit?: string | null;

  @ApiPropertyOptional({ example: '2025-04-28' })
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  billingMonth?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/new.jpg' })
  @IsOptional()
  @IsUrl()
  receiptUrl?: string | null;

  @ApiPropertyOptional({ enum: PAID_FROM_INPUTS })
  @IsOptional()
  @IsIn(PAID_FROM_INPUTS)
  paidFrom?: ExpensePaymentType | 'MESS_DEPOSIT';

  @ApiPropertyOptional({
    enum: ExpensePaymentType,
    description: 'FROM_DEPOSIT, PERSONAL, or COLLECTED_FUND',
  })
  @IsOptional()
  @IsIn(Object.values(ExpensePaymentType))
  paymentType?: ExpensePaymentType;

  @ApiPropertyOptional({ enum: ExpenseUsedBy })
  @IsOptional()
  @IsIn(Object.values(ExpenseUsedBy))
  usedBy?: ExpenseUsedBy;

  @ApiPropertyOptional({ enum: ExpenseSplitMethod })
  @IsOptional()
  @IsIn(Object.values(ExpenseSplitMethod))
  splitMethod?: ExpenseSplitMethod;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => parseStringArray(value))
  @IsArray()
  @IsString({ each: true })
  selectedMemberIds?: string[];

  @ApiPropertyOptional({ type: [CustomExpenseShareDto] })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomExpenseShareDto)
  customShares?: CustomExpenseShareDto[];
}

export class ExpensePreviewDto extends CreateExpenseDto {}

export class RequestPriceReviewDto {
  @ApiProperty({
    example: 'Please review the rice price and update the correct amount.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class ReviewExpenseDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Receipt and amount verified.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ExpenseFilterDto {
  @ApiPropertyOptional({ description: 'Filter by mess ID' })
  @IsOptional()
  @IsString()
  messId?: string;

  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsOptional()
  @IsIn(Object.values(ExpenseCategory))
  category?: ExpenseCategory;

  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ example: '2025-04-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-04-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Filter by billing month instead of expense date',
  })
  @IsOptional()
  @IsDateString()
  billingMonth?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  limit?: string;

  @ApiPropertyOptional({
    enum: ['date', 'expense_date', 'created_at', 'amount'],
    default: 'expense_date',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
