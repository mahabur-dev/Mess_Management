import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
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