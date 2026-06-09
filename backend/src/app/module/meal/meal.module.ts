import { Module } from '@nestjs/common';
import { MealController } from './meal.controller';
import { MealService } from './meal.service';
import { MonthlyBillModule } from '../monthly-bill/monthly-bill.module';

@Module({
  controllers: [MealController],
  providers: [MealService],
  exports: [MealService],
  imports: [MonthlyBillModule]
})
export class MealModule {}
