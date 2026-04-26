// import { Global, Module } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { MongooseModule } from '@nestjs/mongoose';
// import { User, UserSchema } from '../user/entities/user.entity';
// import { JwtModule } from '@nestjs/jwt';

// @Global()
// @Module({
//   imports: [
//     MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
//     JwtModule.register({
//       global: true,
//     }),
//   ],
//   controllers: [AuthController],
//   providers: [AuthService],
//   exports: [JwtModule, AuthService],
// })
// export class AuthModule {}


import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Global()
@Module({
  imports: [
    JwtModule.register({ global: true }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}