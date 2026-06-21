import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Mess ID' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiProperty({ enum: SubscriptionPlan, example: 'MONTHLY' })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: SubscriptionPlan })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  plan?: SubscriptionPlan;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ example: '2026-06-21' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-21' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  days?: number;
}

export class SubscriptionFilterDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  limit?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ enum: SubscriptionPlan })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  plan?: SubscriptionPlan;

  @ApiPropertyOptional({ example: 'created_at' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class UpdateSubscriptionPlanDto {
  @ApiPropertyOptional({ example: '1 Month' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 499 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  days?: number;

  @ApiPropertyOptional({ example: 'Standard monthly subscription for active messes.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'BDT' })
  @IsOptional()
  @IsString()
  currency?: string;
}
