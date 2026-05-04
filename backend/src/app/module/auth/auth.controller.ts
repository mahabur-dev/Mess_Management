import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import AuthGuard from '../../middlewares/auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─────────────────────────────────────────
  // Register
  // ─────────────────────────────────────────
  @Post('register')
  @ApiOperation({ summary: 'Register a new user (admin / manager / member / organizer)' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    console.log('Received registration data:', dto);
    const data = await this.authService.register(dto);
    return { message: 'User registered successfully', data };
  }

  // ─────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────
  @Post('login')
  @ApiOperation({ summary: 'Login and receive access token' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(dto, res);
    return { message: 'Logged in successfully', data };
  }

  // ─────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────
  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear refresh token cookie' })
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    const data = this.authService.logout(res);
    return { message: 'Logged out successfully', data };
  }

  // ─────────────────────────────────────────
  // Get my profile
  // ─────────────────────────────────────────
  @Get('me')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get my profile with mess memberships' })
  async getMe(@Req() req: Request) {
    const data = await this.authService.getMe(req.user!.id);
    return { message: 'Profile fetched successfully', data };
  }

  // ─────────────────────────────────────────
  // Forgot Password
  // ─────────────────────────────────────────
  @Post('forgot-password')
  @ApiOperation({ summary: 'Send OTP to email for password reset' })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(dto);
    return { message: 'OTP sent to email', data };
  }

  // ─────────────────────────────────────────
  // Verify OTP
  // ─────────────────────────────────────────
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP sent to email' })
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const data = await this.authService.verifyOtp(dto);
    return { message: 'OTP verified successfully', data };
  }

  // ─────────────────────────────────────────
  // Reset Password
  // ─────────────────────────────────────────
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password after OTP verification' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const data = await this.authService.resetPassword(dto);
    return { message: 'Password reset successfully', data };
  }

  // ─────────────────────────────────────────
  // Change Password
  // ─────────────────────────────────────────
  @Post('change-password')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change password (authenticated)' })
  @HttpCode(HttpStatus.OK)
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request) {
    const data = await this.authService.changePassword(req.user!.id, dto);
    return { message: 'Password changed successfully', data };
  }
}
