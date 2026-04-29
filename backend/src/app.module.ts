import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './app/module/user/user.module';
import { MealModule } from './app/module/meal/meal.module';
import { MessModule } from './app/module/mess/mess.module';
import { DepositModule } from './app/module/deposit/deposit.module';
import { BazarModule } from './app/module/bazar/bazar.module';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './app/module/auth/auth.module';

// ✅ Import Prisma Module

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    MealModule,
    MessModule,
    DepositModule,
    BazarModule,
    AuthModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
