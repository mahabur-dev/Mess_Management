import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { MonthlyBillModule } from '../monthly-bill/monthly-bill.module';
import { NotificationModule } from '../notification/notification.module';
import { FundLedgerModule } from '../fund-ledger/fund-ledger.module';

@Module({
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
  imports: [MonthlyBillModule, NotificationModule, FundLedgerModule],
})
export class ExpenseModule {}
