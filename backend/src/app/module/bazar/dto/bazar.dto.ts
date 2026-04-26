import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class BazarItemDto {
  @ApiProperty({ example: 'Lal Shak' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateBazarDto {
  @ApiProperty({ example: 'clxyz123456', description: 'Mess ID' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiProperty({ example: 'Daily Grocery' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '2025-04-26' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    type: [BazarItemDto],
    example: [
      { itemName: 'Lal Shak', price: 10 },
      { itemName: 'Rui Fish', price: 200 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BazarItemDto)
  items: BazarItemDto[];
}

export class UpdateBazarDto {
  @ApiPropertyOptional({ example: 'Weekly Grocery' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '2025-04-26' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ type: [BazarItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BazarItemDto)
  items?: BazarItemDto[];
}

export class BazarFilterDto {
  @ApiPropertyOptional({ description: 'Search by bazar name' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ description: 'Filter by mess ID' })
  @IsOptional()
  @IsString()
  messId?: string;

  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: '2025-04-01', description: 'Start date filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-04-30', description: 'End date filter' })
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