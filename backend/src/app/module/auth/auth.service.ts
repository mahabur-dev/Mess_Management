// import { HttpException, Injectable } from '@nestjs/common';
// import { CreateAuthDto } from './dto/create-auth.dto';
// import { User, UserDocument } from '../user/entities/user.entity';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Response } from 'express';
// import * as bcrypt from 'bcrypt';
// import * as jwt from '@nestjs/jwt';
// import config from '../../config';
// import sendMailer from 'src/app/helpers/sendMailer';

// @Injectable()
// export class AuthService {
//   constructor(
//     @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
//     private readonly jwtService: jwt.JwtService,
//   ) {}

//   async register(CreateAuthDto: CreateAuthDto) {
//     const user = await this.userModel.findOne({ email: CreateAuthDto.email });
//     if (user) {
//       throw new HttpException('User already exists', 400);
//     }
//     const newUser = await this.userModel.create(CreateAuthDto);
//     return newUser;
//   }

//   async login(loginDto: { email: string; password: string }, res: Response) {
//     const user = await this.userModel
//       .findOne({ email: loginDto.email })
//       .select('+password');
//     if (!user) {
//       throw new HttpException('User not found', 404);
//     }

//     const isPasswordMatch = await bcrypt.compare(
//       loginDto.password,
//       user.password,
//     );
//     if (!isPasswordMatch) {
//       throw new HttpException('Incorrect password', 401);
//     }

//     const accessToken = this.jwtService.sign(
//       { id: user._id, email: user.email, role: user.role },
//       {
//         secret: config.jwt.accessTokenSecret,
//         expiresIn: config.jwt.accessTokenExpires as any,
//       } as jwt.JwtSignOptions,
//     );
//     const refreshToken = this.jwtService.sign(
//       { id: user._id, email: user.email, role: user.role },
//       {
//         secret: config.jwt.refreshTokenSecret,
//         expiresIn: config.jwt.refreshTokenExpires as any,
//       } as jwt.JwtSignOptions,
//     );
//     res.cookie('refreshToken', refreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: 'strict',
//     });

//     return { accessToken, user };
//   }

//   async forgotPassword(email: string) {
//     const user = await this.userModel.findOne({ email });
//     if (!user) throw new HttpException('Email not found', 404);

//     const generateOtpNumber = Math.floor(100000 + Math.random() * 900000);

//     user.otp = generateOtpNumber.toString();
//     user.otpExpiry = new Date(Date.now() + 60 * 60 * 1000);
//     await user.save();

//     const html = `
//     <div style="font-family: Arial; text-align: center;">
//       <h2 style="color:#4f46e5;">Password Reset OTP</h2>
//       <p>Your OTP code is:</p>
//       <h1 style="letter-spacing:4px;">${generateOtpNumber}</h1>
//       <p>This code will expire in 1 hour.</p>
//     </div>
//   `;

//     await sendMailer(user.email, 'Reset Password OTP', html);

//     return { message: 'Check your email for OTP' };
//   }

//   async verifyEmail(email: string, otp: string) {
//     const user = await this.userModel.findOne({ email });
//     if (!user) throw new HttpException('Invalid link', 400);

//     if (user.otp !== otp) throw new HttpException('Invalid OTP', 400);
//     if (!user.otpExpiry) throw new HttpException('Invalid OTP', 400);
//     const todayDate = new Date();
//     if (user.otpExpiry < todayDate) throw new HttpException('OTP expired', 400);

//     user.otp = undefined as any;
//     user.otpExpiry = undefined as any;

//     user.verifiedForget = true;
//     await user.save();
//     if (!user.verifiedForget) throw new HttpException('Invalid link', 400);

//     return { message: 'OTP verified successfully' };
//   }

//   async resetPasswordChange(email: string, newPassword: string) {
//     const user = await this.userModel.findOne({ email });
//     if (!user) throw new HttpException('Invalid link', 400);

//     if (!user.verifiedForget) throw new HttpException('Invalid link', 400);

//     user.password = newPassword;
//     user.verifiedForget = false;
//     await user.save();

//     return { message: 'Password reset successfully' };
//   }

//   async changePassword(
//     userId: string,
//     oldPassword: string,
//     newPassword: string,
//   ) {
//     const user = await this.userModel.findById(userId).select('+password');
//     if (!user) throw new HttpException('User not found', 404);
//     const isMatch = await bcrypt.compare(oldPassword, user.password);

//     if (!isMatch) throw new HttpException('Invalid old password', 400);

//     if (oldPassword === newPassword)
//       throw new HttpException(
//         'New password cannot be same as old password',
//         400,
//       );

//     user.password = newPassword;
//     await user.save();

//     return { message: 'Password changed successfully' };
//   }
// }


import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import config from '../../config';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import sendMailer from 'src/app/helpers/sendMailer';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  // ─────────────────────────────────────────
  // Register
  // ─────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new HttpException('Email already registered', 400);

    const hashedPassword = await bcrypt.hash(dto.password, config.bcryptSaltRounds);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        mobileNumber: dto.mobileNumber,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mobileNumber: true,
        createdAt: true,
      },
    });

    return user;
  }

  // ─────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────
  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new HttpException('Invalid email or password', 401);
    if (!user.isActive) throw new HttpException('Account is deactivated', 403);

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new HttpException('Invalid email or password', 401);

    const payload = { id: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: config.jwt.accessTokenSecret,
      expiresIn: config.jwt.accessTokenExpires as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: config.jwt.refreshTokenSecret,
      expiresIn: config.jwt.refreshTokenExpires as any,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
    });

    const { password: _, ...safeUser } = user;
    return { accessToken, user: safeUser };
  }

  // ─────────────────────────────────────────
  // Forgot Password
  // ─────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new HttpException('Email not found', 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry },
    });

    const html = `
      <div style="font-family: Arial; text-align: center; max-width:500px; margin:auto;">
        <h2 style="color:#4f46e5;">Mess Management - Password Reset</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing:8px; color:#4f46e5;">${otp}</h1>
        <p>This code will expire in <strong>1 hour</strong>.</p>
        <p style="color:#888;font-size:12px;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendMailer(user.email, 'Password Reset OTP - Mess Management', html);
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
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      throw new HttpException('OTP has expired', 400);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiry: null, isVerified: true },
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
    if (!user.isVerified) throw new HttpException('Please verify OTP first', 400);

    const hashedPassword = await bcrypt.hash(dto.newPassword, config.bcryptSaltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: 'Password reset successfully' };
  }

  // ─────────────────────────────────────────
  // Change Password (authenticated)
  // ─────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', 404);

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new HttpException('Old password is incorrect', 400);

    if (dto.oldPassword === dto.newPassword) {
      throw new HttpException(
        'New password cannot be same as old password',
        400,
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, config.bcryptSaltRounds);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  // ─────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────
  async logout(res: Response) {
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  // ─────────────────────────────────────────
  // Get my profile
  // ─────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        mobileNumber: true,
        city: true,
        state: true,
        country: true,
        postcode: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        messMembers: {
          select: {
            mess: {
              select: {
                id: true,
                messName: true,
                messLocation: true,
              },
            },
          },
        },
      },
    });
    if (!user) throw new HttpException('User not found', 404);
    return user;
  }
}
