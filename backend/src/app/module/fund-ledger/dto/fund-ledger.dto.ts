import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCollectedFundDto {
  @ApiProperty({ example: 'uuid-mess-id' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiProperty({ example: 5000 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: 'Shared utility collection' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class FundLedgerFilterDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  page?: string;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  limit?: string;
}
