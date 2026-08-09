import { Module } from '@nestjs/common';
import { DepositModule } from '../deposit/deposit.module';
import { ExpenseModule } from '../expense/expense.module';
import { MealModule } from '../meal/meal.module';
import { AiAutomationController } from './ai-automation.controller';
import { AiAutomationService } from './ai-automation.service';
import {
  AI_COMMAND_PROVIDER,
  SPEECH_TO_TEXT_PROVIDER,
} from './ai-command.types';
import { GroqProvider } from './providers/groq.provider';

@Module({
  imports: [ExpenseModule, DepositModule, MealModule],
  controllers: [AiAutomationController],
  providers: [
    AiAutomationService,
    GroqProvider,
    { provide: AI_COMMAND_PROVIDER, useExisting: GroqProvider },
    { provide: SPEECH_TO_TEXT_PROVIDER, useExisting: GroqProvider },
  ],
})
export class AiAutomationModule {}
