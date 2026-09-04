import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  BazarDateStatus,
  BazarFrequency,
  BazarRequestStatus,
} from '@prisma/client';

export class UpsertBazarScheduleSettingDto {
  @ApiProperty({ enum: BazarFrequency })
  @IsEnum(BazarFrequency)
  frequency: BazarFrequency;

  @ApiPropertyOptional({
    type: [Number],
    example: [0, 2, 5],
    description: '0=Sunday ... 6=Saturday',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays?: number[];

  @ApiPropertyOptional({ type: [Number], example: [1, 4, 7] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(31)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  customDays?: number[];

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(50)
  defaultMembersPerDate: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(100)
  dutyLimit: number;

  @ApiProperty({ default: false })
  @IsBoolean()
  includeManager: boolean;

  @ApiProperty({
    example: 5,
    description: 'Release is automatic at or before this many days of notice',
  })
  @IsInt()
  @Min(0)
  @Max(31)
  releaseNoticeDays: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  strictFairness?: boolean;
}

export class DateMemberOverrideDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(50)
  requiredMembers: number;
}

export class GenerateBazarScheduleDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  messId: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2020)
  @Max(2200)
  year: number;

  @ApiProperty({ example: 9 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional({ type: [DateMemberOverrideDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DateMemberOverrideDto)
  dateMemberOverrides?: DateMemberOverrideDto[];
}

export class BazarMonthQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2200)
  year?: number;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

export class AssignBazarSlotDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberId: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ReleaseBazarSlotDto {
  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class CreateBazarSwapDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  requesterSlotId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetSlotId: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ReviewBazarRequestDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  approve: boolean;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class BazarRequestQueryDto {
  @ApiPropertyOptional({ enum: BazarRequestStatus })
  @IsOptional()
  @IsEnum(BazarRequestStatus)
  status?: BazarRequestStatus;
}

export class UpdateBazarDateCapacityDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(50)
  requiredMembers: number;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class ChangeBazarDateStatusDto {
  @ApiProperty({ enum: [BazarDateStatus.OPEN, BazarDateStatus.CLOSED] })
  @IsEnum(BazarDateStatus)
  status: BazarDateStatus;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class AddBazarDateDto {
  @ApiProperty({ example: '2026-09-21' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  requiredMembers?: number;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
