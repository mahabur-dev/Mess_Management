import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './app/module/user/user.module';
import { MealModule } from './app/module/meal/meal.module';
import { MessModule } from './app/module/mess/mess.module';
import { DepositModule } from './app/module/deposit/deposit.module';
import { BazarModule } from './app/module/bazar/bazar.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from './app/module/auth/auth.module';
import { NotificationModule } from './app/module/notification/notification.module';
import { MonthlyBillModule } from './app/module/monthly-bill/monthly-bill.module';
import { ExpenseModule } from './app/module/expense/expense.module';
import { ShoppingModule } from './app/module/shopping/shopping.module';
import { PaymentModule } from './app/module/payment/payment.module';
import { FundLedgerModule } from './app/module/fund-ledger/fund-ledger.module';
import { NoticeModule } from './app/module/notice/notice.module';
import { ComplaintModule } from './app/module/complaint/complaint.module';
import { DashboardModule } from './app/module/dashboard/dashboard.module';
import { SubscriptionModule } from './app/module/subscription/subscription.module';
import { ContactRequestModule } from './app/module/contact-request/contact-request.module';
import { MealPatternModule } from './app/module/meal-pattern/meal-pattern.module';

// ✅ Import Prisma Module

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    MealModule,
    MessModule,
    DepositModule,
    BazarModule,
    AuthModule,
    NotificationModule,
    MonthlyBillModule,
    ExpenseModule,
    ShoppingModule,
    PaymentModule,
    FundLedgerModule,
    NoticeModule,
    ComplaintModule,
    DashboardModule,
    SubscriptionModule,
    ContactRequestModule,
    MealPatternModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
