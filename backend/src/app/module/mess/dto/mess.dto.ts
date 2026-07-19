import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDecimal, IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MembershipRole, RequestStatus } from '@prisma/client';

export class MessRoomDto {
  @ApiPropertyOptional({ example: 'Room A' })
  @IsOptional()
  @IsString()
  roomName?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(1)
  perPerson?: number;

  @ApiPropertyOptional({ example: 12000 })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @IsNumber()
  @Min(0)
  roomPrice?: number;
}

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

  @ApiPropertyOptional({ example: 'flat' })
  @IsOptional()
  @IsString()
  messCategory?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  totalSeats?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  monthlyRent?: number;

  @ApiPropertyOptional({ type: [MessRoomDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessRoomDto)
  rooms?: MessRoomDto[];

}

export class RequestMessRegistrationDto {
  @ApiProperty({ example: 'Green House Mess' })
  @IsNotEmpty()
  @IsString()
  messName: string;

  @ApiProperty({ example: 'Narayanganj, Dhaka' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  totalSeats?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  monthlyRent?: number;

  @ApiPropertyOptional({ example: 'Bachelor student mess near campus' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'flat' })
  @IsOptional()
  @IsString()
  messCategory?: string;

  @ApiPropertyOptional({ type: [MessRoomDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessRoomDto)
  rooms?: MessRoomDto[];
}

export class ReviewMessRequestDto {
  @ApiProperty({ enum: [RequestStatus.APPROVED, RequestStatus.REJECTED] })
  @IsEnum(RequestStatus)
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Documents verified' })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

export class RequestMemberJoinDto {
  @ApiProperty({ example: 'uuid-mess-id' })
  @IsUUID()
  messId: string;
}

export class ReviewMemberJoinRequestDto {
  @ApiProperty({ enum: [RequestStatus.APPROVED, RequestStatus.REJECTED] })
  @IsIn([RequestStatus.APPROVED, RequestStatus.REJECTED])
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Accepted by manager' })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

export class CompleteMessSetupDto {
  @ApiPropertyOptional({ example: 'Green House Mess' })
  @IsOptional()
  @IsString()
  messName?: string;

  @ApiPropertyOptional({ example: 'Narayanganj, Dhaka' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  totalSeats?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  monthlyRent?: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  electricityBill?: number;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  gasBill?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  wifiBill?: number;

  @ApiPropertyOptional({ example: 800 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  cleanerBill?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  extraCost?: number;

  @ApiPropertyOptional({ example: 'flat' })
  @IsOptional()
  @IsString()
  messCategory?: string;

  @ApiPropertyOptional({ type: [MessRoomDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessRoomDto)
  rooms?: MessRoomDto[];

  @ApiPropertyOptional({ example: ['BREAKFAST', 'LUNCH', 'DINNER'] })
  @IsOptional()
  mealTypes?: string[];

  @ApiPropertyOptional({ example: 'EXPENSE_DIVIDED_BY_MEAL_COUNT' })
  @IsOptional()
  @IsString()
  mealRateMethod?: string;

  @ApiPropertyOptional({ example: 'Manager assigns weekly bazar turns.' })
  @IsOptional()
  @IsString()
  bazarRules?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(28)
  paymentDeadlineDay?: number;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @IsString()
  mealOffDeadline?: string;
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

  @ApiPropertyOptional({ example: 'Updated mess description' })
  @IsOptional()
  @IsString()
  description?: string;

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

export class MemberJoinRequestFilterDto extends MessFilterDto {
  @ApiPropertyOptional({ enum: [RequestStatus.PENDING, RequestStatus.APPROVED, RequestStatus.REJECTED] })
  @IsOptional()
  @IsIn([RequestStatus.PENDING, RequestStatus.APPROVED, RequestStatus.REJECTED])
  status?: RequestStatus;
}

export class AddMemberDto {
 @ApiProperty({example: "admin@gmail.com"})
 @IsEmail()
 email:string

  @ApiProperty({ example: 'MANAGER', enum: MembershipRole })
  @IsEnum(MembershipRole)
  @IsNotEmpty()
  role: MembershipRole;

  @ApiPropertyOptional({ example: 'A-2' })
  @IsOptional()
  @IsString()
  roomNo?: string;

  @ApiPropertyOptional({ example: 'S-05' })
  @IsOptional()
  @IsString()
  seatNo?: string;

  @ApiPropertyOptional({ example: 4500 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  monthlyRent?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  depositAmount?: number;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ example: 'MANAGER', enum: MembershipRole })
  @IsEnum(MembershipRole)
  @IsNotEmpty()
  role: MembershipRole;
}

export class UpdateMemberDto {
  @ApiPropertyOptional({ enum: MembershipRole })
  @IsOptional()
  @IsEnum(MembershipRole)
  role?: MembershipRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'A-2' })
  @IsOptional()
  @IsString()
  roomNo?: string;

  @ApiPropertyOptional({ example: 'S-05' })
  @IsOptional()
  @IsString()
  seatNo?: string;

  @ApiPropertyOptional({ example: 4500 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  monthlyRent?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  depositAmount?: number;
}
