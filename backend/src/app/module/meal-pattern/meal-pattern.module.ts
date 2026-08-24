import { Module } from '@nestjs/common';
import { MealPatternController } from './meal-pattern.controller';
import { MealPatternService } from './meal-pattern.service';
import { MonthlyBillModule } from '../monthly-bill/monthly-bill.module';

@Module({
  imports: [MonthlyBillModule],
  controllers: [MealPatternController],
  providers: [MealPatternService],
  exports: [MealPatternService],
})
export class MealPatternModule {}
