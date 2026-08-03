import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDepositDto {
  @ApiProperty({ example: 'clxyz123456', description: 'Mess ID' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiPropertyOptional({
    example: 'uuid-member-id',
    description: 'Member receiving the manager-recorded deposit credit',
  })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiProperty({ example: 1500, description: 'Deposit amount in BDT' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: '2025-04-26' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Monthly contribution' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateDepositDto {
  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({ example: '2025-04-26' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Updated note' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class DepositFilterDto {
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

  @ApiPropertyOptional({
    example: '2026-05-01',
    description: 'Filter direct deposits by billing month',
  })
  @IsOptional()
  @IsDateString()
  billMonth?: string;

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
