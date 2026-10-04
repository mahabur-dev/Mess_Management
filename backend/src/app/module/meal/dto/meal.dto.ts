import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus, MealName, MealStatus } from '@prisma/client';

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === '' || value === null || value === undefined) return undefined;
  return Number(value);
};

export class CreateMealDto {
  @ApiProperty({ example: '97938db5-7fc1-47f5-970b-d5ddfc19e612' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiPropertyOptional({
    example: '46083bde-ad97-44bc-94e2-3414160bdb8a',
    description:
      'Only a manager or admin may set attendance for another member',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  memberId?: string;

  @ApiPropertyOptional({
    example: 2,
    description:
      'Total count, including the meal-type base value and guest meals',
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  @Max(21)
  mealCount?: number;

  @ApiProperty({ enum: MealName, example: MealName.DINNER })
  @IsEnum(MealName)
  mealName: MealName;

  @ApiPropertyOptional({ enum: AttendanceStatus, example: AttendanceStatus.ON })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Additional guest meals beyond the meal-type base value',
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  @Max(20)
  guests?: number;

  @ApiProperty({
    example: '2026-08-01',
    description: 'Target meal date in YYYY-MM-DD format',
  })
  @IsDateString()
  date: string;
}

export class BulkMealUpdateItemDto {
  @ApiProperty({ example: '46083bde-ad97-44bc-94e2-3414160bdb8a' })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ enum: MealName, example: MealName.DINNER })
  @IsEnum(MealName)
  mealName: MealName;

  @ApiProperty({
    example: 2,
    minimum: 0,
    maximum: 21,
    description:
      'The complete meal count for this cell. Zero turns the meal off.',
  })
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  @Max(21)
  mealCount: number;

  @ApiPropertyOptional({
    example: 1,
    minimum: 0,
    maximum: 21,
    description:
      'The value originally loaded by the editor. A mismatch returns 409 instead of overwriting a newer change.',
  })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  @Max(21)
  expectedMealCount?: number;
}

export class BulkUpdateMealsDto {
  @ApiProperty({
    example: '2026-08-01',
    description: 'The single meal-sheet date updated by this request.',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    type: [BulkMealUpdateItemDto],
    description:
      'Only changed member/meal cells. Duplicate member and meal pairs are rejected.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BulkMealUpdateItemDto)
  updates: BulkMealUpdateItemDto[];
}

export class BulkOwnMealUpdateItemDto {
  @ApiProperty({ example: '2026-10-04' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: MealName, example: MealName.DINNER })
  @IsEnum(MealName)
  mealName: MealName;

  @ApiProperty({ enum: AttendanceStatus, example: AttendanceStatus.ON })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({ example: 1, minimum: 0, maximum: 20 })
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  @Max(20)
  guests: number;

  @ApiProperty({ example: 2, minimum: 0, maximum: 21 })
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  @Max(21)
  mealCount: number;
}

export class BulkUpdateOwnMealsDto {
  @ApiPropertyOptional({
    example: 'ad0a0c46-6da9-4ecf-9d99-844f03fd7167',
    description: 'Stable key used to make network retries safe',
  })
  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;

  @ApiProperty({
    type: [BulkOwnMealUpdateItemDto],
    description: 'Changed meals for the authenticated member, across one or more dates.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(93)
  @ValidateNested({ each: true })
  @Type(() => BulkOwnMealUpdateItemDto)
  updates: BulkOwnMealUpdateItemDto[];
}

export class UpdateMealDto {
  @ApiPropertyOptional({ example: '2026-08-02' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: MealStatus })
  @IsOptional()
  @IsEnum(MealStatus)
  mealStatus?: MealStatus;

  @ApiPropertyOptional({ example: 'Special schedule for the day' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class LockMealDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  locked: boolean;
}

export class SetMealDeadlineDto {
  @ApiProperty({
    example: '09:00',
    description: 'Opening time for the meal decision window',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must use 24-hour HH:mm format',
  })
  startTime: string;

  @ApiProperty({
    example: '17:00',
    description:
      'Closing time for the meal decision window. Overnight windows may end on the target meal date.',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must use 24-hour HH:mm format',
  })
  endTime: string;
}

export class UpdateMealSettingsDto {
  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  defaultStatus?: AttendanceStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowNoMeal?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  windowNotificationEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  deadlineNotificationEnabled?: boolean;

  @ApiPropertyOptional({ example: 60, minimum: 5, maximum: 720 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(720)
  deadlineReminderMinutes?: number;
}

export class MealFilterDto {
  @ApiPropertyOptional({ description: 'Filter by mess ID' })
  @IsOptional()
  @IsString()
  messId?: string;

  @ApiPropertyOptional({
    description: 'Filter meals containing attendance for this member',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
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

  @ApiPropertyOptional({ example: 'scheduled_date' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
