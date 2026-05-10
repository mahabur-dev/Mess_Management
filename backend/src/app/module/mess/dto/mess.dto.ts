import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDecimal, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMessDto {
  @ApiProperty({ example: 'Green House Mess' })
  @IsNotEmpty()
  @IsString()
  messName: string;

  @ApiProperty({ example: 'Narayanganj, Dhaka' })
  @IsNotEmpty()
  @IsString()
  messLocation: string;

  @ApiProperty({ example: '01711234567' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ example: 'manager@example.com' })
  @IsString()
  @IsOptional() 
  currency:string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ example: '120.50' })
  @IsNotEmpty()
  @Transform(({ value }) => value.toString())
  @IsDecimal()
  meal_rate: string;

}

export class UpdateMessDto {
  @ApiPropertyOptional({ example: 'Green House Mess Updated' })
  @IsOptional()
  @IsString()
  messName?: string;

  @ApiPropertyOptional({ example: 'Dhaka, Bangladesh' })
  @IsOptional()
  @IsString()
  messLocation?: string;

  @ApiPropertyOptional({ example: '01719999999' })
  @IsOptional()
  @IsString()
  managerPhone?: string;

  @ApiPropertyOptional({ example: 'newmanager@example.com' })
  @IsOptional()
  @IsEmail()
  managerEmail?: string;
}

export class MessFilterDto {
  @ApiPropertyOptional({ description: 'Search by mess name or location' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  limit?: string;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class AddMemberDto {
  @ApiProperty({ example: 'clxyz123456' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
