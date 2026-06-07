import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  mixin,
  Type,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import config from '../config';
import { PrismaService } from 'src/prisma/prisma.service';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  messId?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export default function AuthGuard(...roles: string[]): Type<CanActivate> {
  @Injectable()
  class AuthGuardImpl implements CanActivate {
    constructor(
      readonly jwtService: JwtService,
      readonly prisma: PrismaService,
    ) {}

    async canActivate(
      context: ExecutionContext,
    ): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const token = request.headers.authorization?.split(' ')[1];

      if (!token)
        throw new HttpException('Unauthorized: No token provided', 401);

      let decoded: JwtPayload;
      try {
        decoded = this.jwtService.verify<JwtPayload>(token, {
          secret: config.jwt.accessTokenSecret,
        });
      } catch {
        throw new HttpException('Unauthorized: Invalid or expired token', 401);
      }

      if (!decoded) throw new HttpException('Unauthorized', 401);

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, is_active: true },
      });

      if (!user) throw new HttpException('Unauthorized: User not found', 401);
      if (!user.is_active)
        throw new HttpException('Forbidden: Account is deactivated', 403);

      if (roles.length && !roles.includes(user.role)) {
        throw new HttpException('Forbidden: Insufficient permissions', 403);
      }

      request.user = {
        ...decoded,
        email: user.email,
        role: user.role,
      };
      return true;
    }
  }

  return mixin(AuthGuardImpl);
}
