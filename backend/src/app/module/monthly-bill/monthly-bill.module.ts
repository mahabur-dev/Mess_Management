import { Module } from '@nestjs/common';
import { MonthlyBillService } from './monthly-bill.service';
import { MonthlyBillController } from './monthly-bill.controller';

@Module({
  controllers: [MonthlyBillController],
  providers: [MonthlyBillService],
  exports: [MonthlyBillService],
})
export class MonthlyBillModule {}
