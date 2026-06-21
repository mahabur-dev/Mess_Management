import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactRequestSource, ContactRequestStatus, SubscriptionPlan } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactRequestDto {
  @ApiProperty({ example: 'Rahim Uddin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'rahim@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: 'I want to know more about your monthly plan.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: ContactRequestSource, example: ContactRequestSource.CONTACT })
  @IsOptional()
  @IsEnum(ContactRequestSource)
  source?: ContactRequestSource;

  @ApiPropertyOptional({ enum: SubscriptionPlan, example: SubscriptionPlan.MONTHLY })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  requestedPlan?: SubscriptionPlan;
}

export class ContactRequestFilterDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  limit?: string;

  @ApiPropertyOptional({ enum: ContactRequestStatus })
  @IsOptional()
  @IsEnum(ContactRequestStatus)
  status?: ContactRequestStatus;

  @ApiPropertyOptional({ enum: ContactRequestSource })
  @IsOptional()
  @IsEnum(ContactRequestSource)
  source?: ContactRequestSource;

  @ApiPropertyOptional({ example: 'rahim' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ example: 'created_at' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class ReviewContactRequestDto {
  @ApiProperty({ enum: ContactRequestStatus })
  @IsEnum(ContactRequestStatus)
  status: ContactRequestStatus;

  @ApiPropertyOptional({ example: 'Called the customer and shared plan details.' })
  @IsOptional()
  @IsString()
  adminNote?: string;
}
