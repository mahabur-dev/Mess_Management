import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import config from '../../config';
import sendMailer from 'src/app/helpers/sendMailer';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { FirebaseAuthService } from './firebase-auth.service';

// ─── Prisma select: safe user (no password_hash, no otp) ─────────────────────
const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar_url: true,
  nid_number: true,
  nid_image_url: true,
  location: true,
  state: true,
  city: true,
  zipcode: true,
  role: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} as const;

// ─── Prisma select: my profile with mess memberships ─────────────────────────
const MY_PROFILE_SELECT = {
  ...SAFE_USER_SELECT,
  memberships: {
    where: { is_active: true },
    select: {
      role: true,
      joined_at: true,
      mess: {
        select: {
          id: true,
          name: true,
          address: true,
          meal_rate: true,
          currency: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly firebaseAuthService: FirebaseAuthService,
  ) {}

  // ─────────────────────────────────────────
  // Register
  // ─────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new HttpException('Email already registered', 400);

    const password_hash = await bcrypt.hash(
      dto.password,
      config.bcryptSaltRounds,
    );

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password_hash,
        role: 'MEMBER',
        phone: dto.phone,
      },
      select: SAFE_USER_SELECT,
    });

    return user;
  }

  // ─────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────
  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        ...SAFE_USER_SELECT,
        memberships: MY_PROFILE_SELECT.memberships,
        password_hash: true,
      },
    });
    if (!user) throw new HttpException('Invalid email or password', 401);
    if (!user.is_active) throw new HttpException('Account is deactivated', 403);

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) throw new HttpException('Invalid email or password', 401);

    const { password_hash: _passwordHash, ...safeUser } = user;
    return this.createSession(safeUser, res);
  }

  async googleLogin(dto: GoogleLoginDto, res: Response) {
    const identity = await this.firebaseAuthService.verifyGoogleIdToken(
      dto.idToken,
    );

    let user = await this.prisma.user.findUnique({
      where: { firebase_uid: identity.uid },
      select: MY_PROFILE_SELECT,
    });

    if (!user) {
      const emailUser = await this.prisma.user.findUnique({
        where: { email: identity.email },
        select: {
          ...MY_PROFILE_SELECT,
          firebase_uid: true,
        },
      });

      if (emailUser?.firebase_uid && emailUser.firebase_uid !== identity.uid) {
        throw new HttpException('Google account is linked to another user', 409);
      }

      if (emailUser) {
        user = await this.prisma.user.update({
          where: { id: emailUser.id },
          data: {
            firebase_uid: identity.uid,
            is_verified: true,
            avatar_url: emailUser.avatar_url || identity.picture,
          },
          select: MY_PROFILE_SELECT,
        });
      } else {
        const password_hash = await bcrypt.hash(
          randomBytes(48).toString('hex'),
          config.bcryptSaltRounds,
        );
        user = await this.prisma.user.create({
          data: {
            name: identity.name,
            email: identity.email,
            password_hash,
            firebase_uid: identity.uid,
            avatar_url: identity.picture,
            role: 'MEMBER',
            is_verified: true,
          },
          select: MY_PROFILE_SELECT,
        });
      }
    }

    if (!user.is_active) {
      throw new HttpException('Account is deactivated', 403);
    }

    return this.createSession(user, res);
  }

  private createSession(
    user: {
      id: string;
      email: string;
      role: string;
      [key: string]: unknown;
    },
    res: Response,
  ) {
    const payload = { id: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: config.jwt.accessTokenSecret,
      expiresIn: config.jwt.accessTokenExpires as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: config.jwt.refreshTokenSecret,
      expiresIn: config.jwt.refreshTokenExpires as any,
    });

    // res.cookie('refreshToken', refreshToken, {
    //   httpOnly: true,
    //   secure: config.env === 'production',
    //   sameSite: 'strict',
    // });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return {
      accessToken,
      user,
    };
  }

  // ─────────────────────────────────────────
  // Forgot Password — send OTP
  // ─────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new HttpException('Email not found', 404);

    const otp = randomInt(100000, 1000000).toString();
    const otp_expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp, otp_expiry, is_verified: false },
    });

    const html = `
      <div style="font-family: Arial; text-align: center; max-width:500px; margin:auto;">
        <h2 style="color:#4f46e5;">Mess Management — Password Reset</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing:8px; color:#4f46e5;">${otp}</h1>
        <p>This code will expire in <strong>1 hour</strong>.</p>
        <p style="color:#888;font-size:12px;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendMailer(user.email, 'Password Reset OTP — Mess Management', html);
    } catch (error) {
      // Do not leave an OTP active when delivery failed.
      await this.prisma.user.update({
        where: { id: user.id },
        data: { otp: null, otp_expiry: null },
      });
      console.error('Password reset email delivery failed:', error);
      throw new ServiceUnavailableException(
        'Unable to send the password reset email right now',
      );
    }

    return { message: 'OTP sent to your email' };
  }

  // ─────────────────────────────────────────
  // Verify OTP
  // ─────────────────────────────────────────
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || user.otp !== dto.otp) {
      throw new HttpException('Invalid OTP', 400);
    }
    if (!user.otp_expiry || user.otp_expiry < new Date()) {
      throw new HttpException('OTP has expired', 400);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otp_expiry: null, is_verified: true },
    });

    return { message: 'OTP verified successfully' };
  }

  // ─────────────────────────────────────────
  // Reset Password
  // ─────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new HttpException('User not found', 404);
    if (!user.is_verified)
      throw new HttpException('Please verify OTP first', 400);

    const password_hash = await bcrypt.hash(
      dto.newPassword,
      config.bcryptSaltRounds,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password_hash, is_verified: false },
    });

    return { message: 'Password reset successfully' };
  }

  // ─────────────────────────────────────────
  // Change Password (authenticated)
  // ─────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', 404);

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password_hash);
    if (!isMatch) throw new HttpException('Old password is incorrect', 400);

    if (dto.oldPassword === dto.newPassword) {
      throw new HttpException(
        'New password cannot be the same as old password',
        400,
      );
    }

    const password_hash = await bcrypt.hash(
      dto.newPassword,
      config.bcryptSaltRounds,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    });

    return { message: 'Password changed successfully' };
  }

  // ─────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────
  logout(res: Response) {
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  // ─────────────────────────────────────────
  // Get my profile
  // ─────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: MY_PROFILE_SELECT,
    });
    if (!user) throw new HttpException('User not found', 404);
    return user;
  }
}
