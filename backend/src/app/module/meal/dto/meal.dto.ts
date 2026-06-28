import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AttendanceStatus, MealName, MealStatus } from '@prisma/client';

export class CreateMealDto {
  @ApiProperty({ example: 'clxyz123456', description: 'Mess ID' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiPropertyOptional({ example: 'uuid-member-id', description: 'Manager/Admin can set meal for another member' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiProperty({
    example: 1.5,
    description: 'Number of meals (supports 0.5 for half meal, e.g. 0, 0.5, 1, 1.5, 2)',
  })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return 0;
    return Number(value);
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  mealCount: number;

  @ApiPropertyOptional({ enum: MealName, example: MealName.DINNER })
  @IsOptional()
  @IsEnum(MealName)
  mealName?: MealName;

  @ApiPropertyOptional({ enum: AttendanceStatus, example: AttendanceStatus.ON })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ example: 0.5, description: 'Guest meals count (supports 0.5 increments)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsNumber()
  @Min(0)
  @Max(20)
  guests?: number;

  @ApiPropertyOptional({ example: '2025-04-26' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class UpdateMealDto {
  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  mealCount?: number;

  @ApiPropertyOptional({ example: '2025-04-26' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ enum: MealStatus })
  @IsOptional()
  @IsEnum(MealStatus)
  mealStatus?: MealStatus;

  @ApiPropertyOptional({ example: 0.5, description: 'Guest meals count (supports 0.5 increments)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value);
  })
  @IsNumber()
  @Min(0)
  @Max(20)
  guests?: number;
}

export class SetMealDeadlineDto {
  @ApiProperty({ example: '22:00', description: 'Deadline start time (HH:mm) - meal time window starts' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '11:00', description: 'Deadline end time (HH:mm) - meal time window ends, members can no longer add/update' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: '2026-06-15', description: 'Date to apply this deadline (optional, if not provided uses current date)' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class MealFilterDto {
  @ApiPropertyOptional({ description: 'Filter by mess ID' })
  @IsOptional()
  @IsString()
  messId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

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

  @ApiPropertyOptional({ example: 'date' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}