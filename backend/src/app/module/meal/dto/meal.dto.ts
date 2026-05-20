import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
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
    example: 2,
    description: 'Number of meals (supports 0.5 for half meal)',
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

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
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

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(20)
  guests?: number;
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
