import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import config from '../../config';
import sendMailer from 'src/app/helpers/sendMailer';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  ResendEmailVerificationDto,
  ResetPasswordDto,
  VerifyEmailOtpDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { FirebaseAuthService } from './firebase-auth.service';
import {
  type AuthOtpPurpose,
  escapeEmailHtml,
  generateOtp,
  hashAuthSecret,
  matchesAuthSecret,
} from './auth-otp';

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
  is_verified: true,
  created_at: true,
  updated_at: true,
} as const;

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

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, is_active: true, is_verified: true },
    });
    if (exists?.is_verified) {
      throw new HttpException('Email already registered', 409);
    }
    if (exists && !exists.is_active) {
      throw new HttpException('Account is deactivated', 403);
    }
    if (exists) {
      await this.ensureOtpCanBeIssued(exists.id, 'EMAIL_VERIFICATION');
    }

    const password_hash = await bcrypt.hash(
      dto.password,
      config.bcryptSaltRounds,
    );
    const user = exists
      ? await this.prisma.user.update({
          where: { id: exists.id },
          data: { name: dto.name, password_hash, phone: dto.phone },
          select: { id: true, name: true, email: true },
        })
      : await this.prisma.user.create({
          data: {
            name: dto.name,
            email: dto.email,
            password_hash,
            role: 'MEMBER',
            phone: dto.phone,
            is_verified: false,
          },
          select: { id: true, name: true, email: true },
        });

    const challenge = await this.issueOtpChallenge(
      user.id,
      'EMAIL_VERIFICATION',
    );
    try {
      await this.sendOtpEmail({
        email: user.email,
        name: user.name,
        otp: challenge.otp,
        purpose: 'EMAIL_VERIFICATION',
      });
    } catch (error) {
      await this.clearOtpChallenge(user.id, 'EMAIL_VERIFICATION');
      console.error('Registration verification email delivery failed:', error);
      throw new ServiceUnavailableException(
        'Unable to send the verification email right now',
      );
    }

    return {
      email: user.email,
      expiresInSeconds: config.authOtp.expiresMinutes * 60,
      resendAvailableInSeconds: config.authOtp.resendCooldownSeconds,
    };
  }

  async verifyEmail(dto: VerifyEmailOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, is_verified: true },
    });
    if (!user) throw new HttpException('Invalid verification code', 400);
    if (user.is_verified) return { email: user.email, verified: true };

    const challenge = await this.requireValidOtpChallenge(
      user.id,
      'EMAIL_VERIFICATION',
      dto.otp,
    );
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { is_verified: true, otp: null, otp_expiry: null },
      }),
      this.prisma.authOtpChallenge.delete({ where: { id: challenge.id } }),
    ]);

    return { email: user.email, verified: true };
  }

  async resendEmailVerification(dto: ResendEmailVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        name: true,
        email: true,
        is_active: true,
        is_verified: true,
      },
    });
    if (!user) throw new HttpException('Registration not found', 404);
    if (!user.is_active) throw new HttpException('Account is deactivated', 403);
    if (user.is_verified)
      throw new HttpException('Email already verified', 409);

    const challenge = await this.issueOtpChallenge(
      user.id,
      'EMAIL_VERIFICATION',
    );
    try {
      await this.sendOtpEmail({
        email: user.email,
        name: user.name,
        otp: challenge.otp,
        purpose: 'EMAIL_VERIFICATION',
      });
    } catch (error) {
      await this.clearOtpChallenge(user.id, 'EMAIL_VERIFICATION');
      console.error('Verification email resend failed:', error);
      throw new ServiceUnavailableException(
        'Unable to send the verification email right now',
      );
    }

    return {
      email: user.email,
      expiresInSeconds: config.authOtp.expiresMinutes * 60,
      resendAvailableInSeconds: config.authOtp.resendCooldownSeconds,
    };
  }

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
    if (!user.is_verified) {
      throw new HttpException(
        'Please verify your email before signing in',
        403,
      );
    }

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
        select: { ...MY_PROFILE_SELECT, firebase_uid: true },
      });
      if (emailUser?.firebase_uid && emailUser.firebase_uid !== identity.uid) {
        throw new HttpException(
          'Google account is linked to another user',
          409,
        );
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
        await this.clearOtpChallenge(emailUser.id, 'EMAIL_VERIFICATION');
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
    if (!user.is_active) throw new HttpException('Account is deactivated', 403);
    return this.createSession(user, res);
  }

  private createSession(
    user: { id: string; email: string; role: string; [key: string]: unknown },
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
    const isProduction = config.env === 'production';
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    return { accessToken, user };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, name: true, email: true, is_active: true },
    });
    if (!user?.is_active) {
      return { message: 'If the account exists, an OTP was sent' };
    }

    const challenge = await this.issueOtpChallenge(user.id, 'PASSWORD_RESET');
    try {
      await this.sendOtpEmail({
        email: user.email,
        name: user.name,
        otp: challenge.otp,
        purpose: 'PASSWORD_RESET',
      });
    } catch (error) {
      await this.clearOtpChallenge(user.id, 'PASSWORD_RESET');
      console.error('Password reset email delivery failed:', error);
      throw new ServiceUnavailableException(
        'Unable to send the password reset email right now',
      );
    }
    return { message: 'If the account exists, an OTP was sent' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (!user) throw new HttpException('Invalid OTP', 400);

    const challenge = await this.requireValidOtpChallenge(
      user.id,
      'PASSWORD_RESET',
      dto.otp,
    );
    const resetToken = randomBytes(32).toString('hex');
    const now = new Date();
    await this.prisma.authOtpChallenge.update({
      where: { id: challenge.id },
      data: {
        verified_at: now,
        verification_token_hash: this.hashAuthSecret(
          resetToken,
          user.id,
          'PASSWORD_RESET',
        ),
        verification_token_expiry: new Date(
          now.getTime() + config.authOtp.resetTokenExpiresMinutes * 60_000,
        ),
      },
    });
    return {
      resetToken,
      expiresInSeconds: config.authOtp.resetTokenExpiresMinutes * 60,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (!user) throw new HttpException('User not found', 404);

    const challenge = await this.prisma.authOtpChallenge.findUnique({
      where: {
        user_id_purpose: { user_id: user.id, purpose: 'PASSWORD_RESET' },
      },
    });
    const suppliedTokenHash = this.hashAuthSecret(
      dto.resetToken,
      user.id,
      'PASSWORD_RESET',
    );
    if (
      !challenge?.verified_at ||
      !challenge.verification_token_hash ||
      !challenge.verification_token_expiry ||
      challenge.verification_token_expiry < new Date() ||
      !matchesAuthSecret(suppliedTokenHash, challenge.verification_token_hash)
    ) {
      throw new HttpException(
        'Password reset authorization is invalid or expired',
        400,
      );
    }

    const password_hash = await bcrypt.hash(
      dto.newPassword,
      config.bcryptSaltRounds,
    );
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password_hash },
      }),
      this.prisma.authOtpChallenge.delete({ where: { id: challenge.id } }),
    ]);
    return { message: 'Password reset successfully' };
  }

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

  logout(res: Response) {
    const isProduction = config.env === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: MY_PROFILE_SELECT,
    });
    if (!user) throw new HttpException('User not found', 404);
    return user;
  }

  private hashAuthSecret(
    secret: string,
    userId: string,
    purpose: AuthOtpPurpose,
  ) {
    return hashAuthSecret(secret, userId, purpose, config.authOtp.pepper);
  }

  private async issueOtpChallenge(userId: string, purpose: AuthOtpPurpose) {
    const now = new Date();
    await this.ensureOtpCanBeIssued(userId, purpose, now);
    const otp = generateOtp();
    const expiresAt = new Date(
      now.getTime() + config.authOtp.expiresMinutes * 60_000,
    );
    const resendAvailableAt = new Date(
      now.getTime() + config.authOtp.resendCooldownSeconds * 1000,
    );
    await this.prisma.authOtpChallenge.upsert({
      where: { user_id_purpose: { user_id: userId, purpose } },
      create: {
        user_id: userId,
        purpose,
        otp_hash: this.hashAuthSecret(otp, userId, purpose),
        expires_at: expiresAt,
        resend_available_at: resendAvailableAt,
      },
      update: {
        otp_hash: this.hashAuthSecret(otp, userId, purpose),
        expires_at: expiresAt,
        resend_available_at: resendAvailableAt,
        failed_attempts: 0,
        verified_at: null,
        verification_token_hash: null,
        verification_token_expiry: null,
      },
    });
    return { otp };
  }

  private async ensureOtpCanBeIssued(
    userId: string,
    purpose: AuthOtpPurpose,
    now = new Date(),
  ) {
    const current = await this.prisma.authOtpChallenge.findUnique({
      where: { user_id_purpose: { user_id: userId, purpose } },
    });
    if (current?.resend_available_at && current.resend_available_at > now) {
      const retryAfterSeconds = Math.ceil(
        (current.resend_available_at.getTime() - now.getTime()) / 1000,
      );
      throw new HttpException(
        {
          message: `Please wait ${retryAfterSeconds} seconds before requesting another code`,
          params: { retryAfterSeconds },
        },
        429,
      );
    }
  }

  private async requireValidOtpChallenge(
    userId: string,
    purpose: AuthOtpPurpose,
    otp: string,
  ) {
    const challenge = await this.prisma.authOtpChallenge.findUnique({
      where: { user_id_purpose: { user_id: userId, purpose } },
    });
    if (!challenge || challenge.verified_at) {
      throw new HttpException('Invalid OTP', 400);
    }
    if (challenge.expires_at < new Date()) {
      await this.prisma.authOtpChallenge.delete({
        where: { id: challenge.id },
      });
      throw new HttpException('OTP has expired', 400);
    }
    if (challenge.failed_attempts >= config.authOtp.maxAttempts) {
      throw new HttpException(
        'Too many invalid OTP attempts. Request a new code',
        429,
      );
    }

    const suppliedHash = this.hashAuthSecret(otp, userId, purpose);
    if (!matchesAuthSecret(suppliedHash, challenge.otp_hash)) {
      await this.prisma.authOtpChallenge.update({
        where: { id: challenge.id },
        data: { failed_attempts: { increment: 1 } },
      });
      throw new HttpException('Invalid OTP', 400);
    }
    return challenge;
  }

  private clearOtpChallenge(userId: string, purpose: AuthOtpPurpose) {
    return this.prisma.authOtpChallenge.deleteMany({
      where: { user_id: userId, purpose },
    });
  }

  private sendOtpEmail(input: {
    email: string;
    name: string;
    otp: string;
    purpose: AuthOtpPurpose;
  }) {
    const isRegistration = input.purpose === 'EMAIL_VERIFICATION';
    const title = isRegistration ? 'Verify your email' : 'Reset your password';
    const safeName = escapeEmailHtml(input.name);
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a;">
        <h2 style="color:#008b80;">Messzen — ${title}</h2>
        <p>Hello ${safeName},</p>
        <p>Use this one-time code to ${isRegistration ? 'finish creating your account' : 'continue resetting your password'}:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#008b80;">${input.otp}</p>
        <p>This code expires in <strong>${config.authOtp.expiresMinutes} minutes</strong>.</p>
        <p style="color:#64748b;font-size:12px;">Never share this code. If you did not make this request, you can ignore this email.</p>
      </div>
    `;
    return sendMailer(input.email, `${title} — Messzen`, html);
  }
}
