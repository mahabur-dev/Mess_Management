import { IsBoolean, IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MealPatternType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMealPatternDto {
  @ApiProperty({ description: 'Membership receiving this pattern' })
  @IsUUID()
  membershipId: string;

  @ApiProperty({ enum: MealPatternType })
  @IsEnum(MealPatternType)
  patternType: MealPatternType;

  @ApiPropertyOptional({ description: 'Meal booleans for DAILY patterns' })
  @IsOptional()
  dailySchedule?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Day-to-meal booleans for WEEKLY patterns' })
  @IsOptional()
  weeklySchedule?: Record<string, unknown>;

  @ApiProperty({ example: '2026-08-10' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}

export class UpdateMealPatternDto {
  @ApiPropertyOptional({ enum: MealPatternType })
  @IsOptional()
  @IsEnum(MealPatternType)
  patternType?: MealPatternType;

  @ApiPropertyOptional()
  @IsOptional()
  dailySchedule?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  weeklySchedule?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
