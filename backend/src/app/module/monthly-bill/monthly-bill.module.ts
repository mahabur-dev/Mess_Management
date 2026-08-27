import { Module } from '@nestjs/common';
import { MonthlyBillService } from './monthly-bill.service';
import { MonthlyBillController } from './monthly-bill.controller';
import { MonthlyBillReconciliationService } from './monthly-bill-reconciliation.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [MonthlyBillController],
  providers: [MonthlyBillService, MonthlyBillReconciliationService],
  exports: [MonthlyBillService, MonthlyBillReconciliationService],
})
export class MonthlyBillModule {}
