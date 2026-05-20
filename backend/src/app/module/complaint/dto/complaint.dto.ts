import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintCategory, ComplaintStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateComplaintDto {
  @ApiProperty({ example: 'uuid-mess-id' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiProperty({ enum: ComplaintCategory, example: ComplaintCategory.MEAL_CORRECTION })
  @IsEnum(ComplaintCategory)
  category: ComplaintCategory;

  @ApiProperty({ example: 'Dinner count correction' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'My dinner was off but counted as on.' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class UpdateComplaintStatusDto {
  @ApiProperty({ enum: ComplaintStatus })
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @ApiPropertyOptional({ example: 'Corrected in meal sheet' })
  @IsOptional()
  @IsString()
  response?: string;
}

export class ComplaintFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ enum: ComplaintStatus })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiPropertyOptional({ enum: ComplaintCategory })
  @IsOptional()
  @IsEnum(ComplaintCategory)
  category?: ComplaintCategory;

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
