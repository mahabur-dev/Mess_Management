import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FirebaseAuthService } from './firebase-auth.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: process.env.ACCESS_TOKEN_SECRET,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthService],
  exports: [JwtModule, FirebaseAuthService],
})
export class AuthModule {}
