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
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';

@Module({
  imports: [ExpenseModule, DepositModule, MealModule],
  controllers: [AiAutomationController],
  providers: [
    AiAutomationService,
    OpenAiCompatibleProvider,
    { provide: AI_COMMAND_PROVIDER, useExisting: OpenAiCompatibleProvider },
    { provide: SPEECH_TO_TEXT_PROVIDER, useExisting: OpenAiCompatibleProvider },
  ],
})
export class AiAutomationModule {}
