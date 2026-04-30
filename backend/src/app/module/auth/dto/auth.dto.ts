import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { GlobalRole } from '@prisma/client';

// ─────────────────────────────────────────
// Register
// ─────────────────────────────────────────
export class RegisterDto {
  @ApiProperty({ example: 'Rakib Khan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'rakib@example.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiPropertyOptional({ enum: GlobalRole, default: GlobalRole.MEMBER })
  @IsOptional()
  @IsEnum(GlobalRole)
  role?: GlobalRole;

  @ApiPropertyOptional({ example: '01711234567' })
  @IsOptional()
  @IsString()
  phone?: string;
}

// ─────────────────────────────────────────
// Login
// ─────────────────────────────────────────
export class LoginDto {
  @ApiProperty({ example: 'rakib@example.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}

// ─────────────────────────────────────────
// Forgot Password
// ─────────────────────────────────────────
export class ForgotPasswordDto {
  @ApiProperty({ example: 'rakib@example.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email: string;
}

// ─────────────────────────────────────────
// Verify OTP
// ─────────────────────────────────────────
export class VerifyOtpDto {
  @ApiProperty({ example: 'rakib@example.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

// ─────────────────────────────────────────
// Reset Password
// ─────────────────────────────────────────
export class ResetPasswordDto {
  @ApiProperty({ example: 'rakib@example.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'newSecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword: string;
}

// ─────────────────────────────────────────
// Change Password
// ─────────────────────────────────────────
export class ChangePasswordDto {
  @ApiProperty({ example: 'oldSecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  oldPassword: string;

  @ApiProperty({ example: 'newSecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword: string;
}
