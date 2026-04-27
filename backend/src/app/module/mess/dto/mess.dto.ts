import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMessDto {
  @ApiProperty({ example: 'Green House Mess' })
  @IsString()
  @IsNotEmpty()
  messName: string;

  @ApiProperty({ example: 'Narayanganj, Dhaka' })
  @IsString()
  @IsNotEmpty()
  messLocation: string;

  @ApiProperty({ example: '01711234567' })
  @IsString()
  @IsNotEmpty()
  managerPhone: string;

  @ApiProperty({ example: 'manager@example.com' })
  @IsEmail()
  @IsNotEmpty()
  managerEmail: string;
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
