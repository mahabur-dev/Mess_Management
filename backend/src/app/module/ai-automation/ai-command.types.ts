export const SUPPORTED_LOCALES = ['en', 'bn'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const SUPPORTED_SPEECH_LANGUAGES = ['auto', 'en', 'bn'] as const;
export type SpeechLanguage = (typeof SUPPORTED_SPEECH_LANGUAGES)[number];

export const AI_INTENTS = [
  'EXPENSE_CREATE',
  'UTILITY_CREATE',
  'DEPOSIT_CREATE',
  'MEAL_CREATE',
  'UNKNOWN',
  'NEEDS_CLARIFICATION',
] as const;

export type AiIntent = (typeof AI_INTENTS)[number];

export const EXPENSE_CATEGORIES = [
  'GROCERY',
  'UTILITY',
  'RENT',
  'FOOD',
  'GAS',
  'ELECTRICITY',
  'WIFI',
  'CLEANER',
  'MAINTENANCE',
  'BUABILL',
  'WATER',
  'OTHER',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const UTILITY_TYPES = [
  'ELECTRICITY',
  'GAS',
  'WATER',
  'WIFI',
  'CLEANING',
  'OTHER',
] as const;

export type UtilityType = (typeof UTILITY_TYPES)[number];

export const MEAL_NAMES = ['BREAKFAST', 'LUNCH', 'DINNER', 'OTHER'] as const;
export type MealName = (typeof MEAL_NAMES)[number];

export const MEAL_STATUSES = ['ON', 'OFF'] as const;
export type MealStatus = (typeof MEAL_STATUSES)[number];

export type ParsedExpenseItem = {
  amount: number | null;
  date: string | null;
  category: ExpenseCategory | null;
  utilityType: UtilityType | null;
  itemName: string | null;
  description: string | null;
  memberName: string | null;
  quantity: number | null;
  unit: string | null;
};

export type ParsedCommandData = {
  amount: number | null;
  date: string | null;
  category: ExpenseCategory | null;
  utilityType: UtilityType | null;
  itemName: string | null;
  description: string | null;
  memberName: string | null;
  mealName: MealName | null;
  mealCount: number | null;
  status: MealStatus | null;
  quantity: number | null;
  unit: string | null;
  items: ParsedExpenseItem[];
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
  locale: AppLocale;
  actorName: string;
  canManage: boolean;
  memberNames: string[];
};

export interface SpeechToTextProvider {
  transcribe(file: Express.Multer.File, language?: SpeechLanguage): Promise<string>;
}

export interface AiCommandProvider {
  parse(text: string, context: AiParseContext): Promise<ParsedAiCommand>;
}

export const SPEECH_TO_TEXT_PROVIDER = Symbol('SpeechToTextProvider');
export const AI_COMMAND_PROVIDER = Symbol('AiCommandProvider');




// export const AI_INTENTS = [
//   'EXPENSE_CREATE',
//   'UTILITY_CREATE',
//   'DEPOSIT_CREATE',
//   'MEAL_CREATE',
//   'UNKNOWN',
//   'NEEDS_CLARIFICATION',
// ] as const;

// export type AiIntent = (typeof AI_INTENTS)[number];

// export type ParsedCommandData = {
//   amount: number | null;
//   date: string | null;
//   category: string | null;
//   utilityType: string | null;
//   itemName: string | null;
//   description: string | null;
//   memberName: string | null;
//   mealName: string | null;
//   mealCount: number | null;
//   status: string | null;
//   quantity: number | null;
//   unit: string | null;
//   items: ParsedExpenseItem[];
// };

// export type ParsedExpenseItem = {
//   amount: number | null;
//   date: string | null;
//   category: string | null;
//   utilityType: string | null;
//   itemName: string | null;
//   description: string | null;
//   memberName: string | null;
//   quantity: number | null;
//   unit: string | null;
// };

// export type ParsedAiCommand = {
//   intent: AiIntent;
//   confidence: number;
//   clarification: string | null;
//   missingFields: string[];
//   data: ParsedCommandData;
// };

// export type AiParseContext = {
//   today: string;
//   timeZone: string;
//   locale: 'en' | 'bn';
//   actorName: string;
//   canManage: boolean;
//   memberNames: string[];
// };

// export interface SpeechToTextProvider {
//   transcribe(
//     file: Express.Multer.File,
//     language: 'en' | 'bn',
//   ): Promise<string>;
// }

// export interface AiCommandProvider {
//   parse(text: string, context: AiParseContext): Promise<ParsedAiCommand>;
// }

// export const SPEECH_TO_TEXT_PROVIDER = Symbol('SpeechToTextProvider');
// export const AI_COMMAND_PROVIDER = Symbol('AiCommandProvider');
