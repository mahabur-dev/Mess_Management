import { Module } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { MonthlyBillModule } from '../monthly-bill/monthly-bill.module';

@Module({
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
  imports: [MonthlyBillModule]
})
export class ExpenseModule {}
