import { Module } from '@nestjs/common';
import { MealPatternController } from './meal-pattern.controller';
import { MealPatternService } from './meal-pattern.service';

@Module({ controllers: [MealPatternController], providers: [MealPatternService], exports: [MealPatternService] })
export class MealPatternModule {}
