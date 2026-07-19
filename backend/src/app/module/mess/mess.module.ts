import { Module } from '@nestjs/common';
import { MessService } from './mess.service';
import { MessController } from './mess.controller';
import { MessRequestController } from './mess-request.controller';
import { MemberJoinRequestController } from './member-join-request.controller';
import { MonthlyBillModule } from '../monthly-bill/monthly-bill.module';
import { NotificationModule } from '../notification/notification.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  controllers: [MessController, MessRequestController, MemberJoinRequestController],
  providers: [MessService],
  exports: [MessService],
  imports: [MonthlyBillModule, NotificationModule, SubscriptionModule],
})
export class MessModule {}
