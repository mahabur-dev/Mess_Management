import { Module } from '@nestjs/common';
import { MessService } from './mess.service';
import { MessController } from './mess.controller';
import { MessRequestController } from './mess-request.controller';
import { MonthlyBillModule } from '../monthly-bill/monthly-bill.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  controllers: [MessController, MessRequestController],
  providers: [MessService],
  exports: [MessService],
  imports: [MonthlyBillModule, NotificationModule],
})
export class MessModule {}
