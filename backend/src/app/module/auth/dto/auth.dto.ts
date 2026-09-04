import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

// ─────────────────────────────────────────
// Register
// ─────────────────────────────────────────
export class RegisterDto {
  @ApiProperty({ example: 'Rakib Khan' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'rakib@example.com' })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ example: '01711234567' })
  @IsOptional()
  @Transform(({ value }) => {
    const phone = String(value ?? '').trim();
    return phone || undefined;
  })
  @IsString()
  @MaxLength(40)
  phone?: string;
}

// ─────────────────────────────────────────
// Login
// ─────────────────────────────────────────
export class LoginDto {
  @ApiProperty({ example: 'rakib@example.com' })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(128)
  password: string;
}

// ─────────────────────────────────────────
// Forgot Password
// ─────────────────────────────────────────
export class GoogleLoginDto {
  @ApiProperty({ description: 'Firebase ID token issued after Google sign-in' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @MinLength(100)
  @MaxLength(10000)
  idToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'rakib@example.com' })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  @MaxLength(255)
  email: string;
}

// ─────────────────────────────────────────
// Verify OTP
// ─────────────────────────────────────────
export class VerifyOtpDto {
  @ApiProperty({ example: 'rakib@example.com' })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '123456' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}

export class VerifyEmailOtpDto extends VerifyOtpDto {}

export class ResendEmailVerificationDto {
  @ApiProperty({ example: 'rakib@example.com' })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  @MaxLength(255)
  email: string;
}

// ─────────────────────────────────────────
// Reset Password
// ─────────────────────────────────────────
export class ResetPasswordDto {
  @ApiProperty({ example: 'rakib@example.com' })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'One-time token returned after OTP verification',
  })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  resetToken: string;

  @ApiProperty({ example: 'newSecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(128)
  newPassword: string;
}

// ─────────────────────────────────────────
// Change Password
// ─────────────────────────────────────────
export class ChangePasswordDto {
  @ApiProperty({ example: 'oldSecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(128)
  oldPassword: string;

  @ApiProperty({ example: 'newSecret123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(128)
  newPassword: string;
}
