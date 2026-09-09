import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class GenerateMonthlyReportDto {
  @ApiProperty({ description: 'Mess ID' })
  @IsUUID()
  messId: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  month: string;
}

export class MonthlyReportMonthQueryDto {
  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  month: string;
}

export class MonthlyReportPdfQueryDto {
  @ApiPropertyOptional({ enum: ['en', 'bn'] })
  @IsOptional()
  @IsIn(['en', 'bn'])
  locale?: 'en' | 'bn';
}

export class UpdateMonthlyReportSettingDto {
  @ApiProperty()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  autoGenerate: boolean;

  @ApiProperty()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  emailMembers: boolean;
}
