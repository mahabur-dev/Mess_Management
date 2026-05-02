import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ example: 'uuid-mess-id', description: 'Mess ID' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.ANNOUNCEMENT })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Meal update for tomorrow' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Dinner will be served at 9 PM tomorrow.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ example: { mealId: 'uuid' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class NotificationFilterDto {
  @ApiPropertyOptional({ description: 'Filter by mess ID' })
  @IsOptional()
  @IsString()
  messId?: string;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  limit?: string;

  @ApiPropertyOptional({ example: 'created_at' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
