import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { MonthlyBillModule } from '../monthly-bill/monthly-bill.module';

@Module({
  imports: [MonthlyBillModule],
  controllers: [DepositController],
  providers: [DepositService],
  exports: [DepositService],
})
export class DepositModule {}
