import { Module } from '@nestjs/common';
import { MealController } from './meal.controller';
import { MealService } from './meal.service';
import { MonthlyBillModule } from '../monthly-bill/monthly-bill.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  controllers: [MealController],
  providers: [MealService],
  exports: [MealService],
  imports: [MonthlyBillModule, NotificationModule]
})
export class MealModule {}
