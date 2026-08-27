import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PersonalTransactionType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePersonalTransactionDto {
  @ApiProperty({ enum: PersonalTransactionType })
  @IsEnum(PersonalTransactionType)
  type: PersonalTransactionType;

  @ApiProperty({ example: 'GROCERY' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  category: string;

  @ApiProperty({ example: 850 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-08-26' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Weekly groceries' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Owned family member ID' })
  @IsOptional()
  @IsUUID()
  familyMemberId?: string | null;
}

export class UpdatePersonalTransactionDto extends PartialType(
  CreatePersonalTransactionDto,
) {}

export class PersonalTransactionFilterDto {
  @ApiPropertyOptional({ enum: PersonalTransactionType })
  @IsOptional()
  @IsEnum(PersonalTransactionType)
  type?: PersonalTransactionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: '2026-08' })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  familyMemberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value?.toString())
  page?: string;

  @IsOptional()
  @Transform(({ value }) => value?.toString())
  limit?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class PersonalMonthQueryDto {
  @ApiPropertyOptional({ example: '2026-08' })
  @IsOptional()
  @IsString()
  month?: string;
}

export class CreateFamilyMemberDto {
  @ApiProperty({ example: 'Father' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'FATHER' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  relation: string;
}

export class UpdateFamilyMemberDto extends PartialType(CreateFamilyMemberDto) {}

export class CreatePersonalBudgetDto {
  @ApiProperty({ example: '2026-08' })
  @IsString()
  @IsNotEmpty()
  month: string;

  @ApiProperty({ example: 'FOOD' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  category: string;

  @ApiProperty({ example: 10000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  limitAmount: number;
}

export class UpdatePersonalBudgetDto {
  @ApiPropertyOptional({ example: 12000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  limitAmount?: number;
}
