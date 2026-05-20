import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid-mess-id' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiPropertyOptional({ example: 'uuid-monthly-bill-id' })
  @IsOptional()
  @IsString()
  monthlyBillId?: string;

  @ApiProperty({ example: 2500 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BKASH })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ example: 'TXN123456' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/payment.jpg' })
  @IsOptional()
  @IsUrl()
  screenshotUrl?: string;

  @ApiPropertyOptional({ example: 'Paid for May bill' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ReviewPaymentDto {
  @ApiProperty({ enum: [PaymentStatus.APPROVED, PaymentStatus.REJECTED] })
  @IsEnum(PaymentStatus)
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Transaction matched' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class PaymentFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-05-31' })
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
