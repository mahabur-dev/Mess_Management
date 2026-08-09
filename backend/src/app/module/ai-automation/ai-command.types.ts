export const AI_INTENTS = [
  'EXPENSE_CREATE',
  'UTILITY_CREATE',
  'DEPOSIT_CREATE',
  'MEAL_CREATE',
  'UNKNOWN',
  'NEEDS_CLARIFICATION',
] as const;

export type AiIntent = (typeof AI_INTENTS)[number];

export type ParsedCommandData = {
  amount: number | null;
  date: string | null;
  category: string | null;
  utilityType: string | null;
  itemName: string | null;
  description: string | null;
  memberName: string | null;
  mealName: string | null;
  mealCount: number | null;
  status: string | null;
};

export type ParsedAiCommand = {
  intent: AiIntent;
  confidence: number;
  clarification: string | null;
  missingFields: string[];
  data: ParsedCommandData;
};

export type AiParseContext = {
  today: string;
  timeZone: string;
  locale: 'en' | 'bn';
  actorName: string;
  canManage: boolean;
  memberNames: string[];
};

export interface SpeechToTextProvider {
  transcribe(
    file: Express.Multer.File,
    language: 'en' | 'bn',
  ): Promise<string>;
}

export interface AiCommandProvider {
  parse(text: string, context: AiParseContext): Promise<ParsedAiCommand>;
}

export const SPEECH_TO_TEXT_PROVIDER = Symbol('SpeechToTextProvider');
export const AI_COMMAND_PROVIDER = Symbol('AiCommandProvider');
