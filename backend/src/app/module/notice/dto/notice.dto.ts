import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoticeType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNoticeDto {
  @ApiProperty({ example: 'uuid-mess-id' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiProperty({ enum: NoticeType, example: NoticeType.PAYMENT })
  @IsEnum(NoticeType)
  type: NoticeType;

  @ApiProperty({ example: 'Payment deadline' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Please clear all dues by the 10th.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

export class UpdateNoticeDto {
  @ApiPropertyOptional({ enum: NoticeType })
  @IsOptional()
  @IsEnum(NoticeType)
  type?: NoticeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

export class NoticeFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messId?: string;

  @ApiPropertyOptional({ enum: NoticeType })
  @IsOptional()
  @IsEnum(NoticeType)
  type?: NoticeType;

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
