import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ShoppingListStatus } from '@prisma/client';

export class CreateShoppingItemDto {
  @ApiProperty({ example: 'Rice' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 5, description: 'Quantity' })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedPrice?: number;

  @ApiPropertyOptional({ example: 'Prefer premium brand' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateShoppingListDto {
  @ApiProperty({ example: 'uuid-mess-id', description: 'Mess ID' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiProperty({ example: 'Weekly Grocery Run' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '2025-04-26', description: 'Market date' })
  @IsDateString()
  marketDate: string;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBudget?: number;

  @ApiPropertyOptional({ type: [CreateShoppingItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateShoppingItemDto)
  items?: CreateShoppingItemDto[];
}

export class UpdateShoppingListDto {
  @ApiPropertyOptional({ example: 'Updated Grocery Run' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: '2025-04-28' })
  @IsOptional()
  @IsDateString()
  marketDate?: string;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBudget?: number;

  @ApiPropertyOptional({ enum: ShoppingListStatus })
  @IsOptional()
  @IsEnum(ShoppingListStatus)
  status?: ShoppingListStatus;
}

export class UpdateShoppingItemDto {
  @ApiPropertyOptional({ example: 'Lentils' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number;

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedPrice?: number;

  @ApiPropertyOptional({ example: 185 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualPrice?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPurchased?: boolean;

  @ApiPropertyOptional({ example: 'Bought from local market' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ShoppingFilterDto {
  @ApiPropertyOptional({ description: 'Filter by mess ID' })
  @IsOptional()
  @IsString()
  messId?: string;

  @ApiPropertyOptional({ enum: ShoppingListStatus })
  @IsOptional()
  @IsEnum(ShoppingListStatus)
  status?: ShoppingListStatus;

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

  @ApiPropertyOptional({ example: 'created_at' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
