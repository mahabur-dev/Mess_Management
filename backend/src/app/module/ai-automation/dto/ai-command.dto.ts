import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  SUPPORTED_LOCALES,
  SUPPORTED_SPEECH_LANGUAGES,
  type AppLocale,
  type SpeechLanguage,
} from '../ai-command.types';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

function lowerString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class CreateTextCommandDto {
  @IsUUID()
  messId: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2000)
  text: string;

  @IsOptional()
  @Transform(lowerString)
  @IsIn(SUPPORTED_LOCALES)
  locale?: AppLocale;

  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;
}

export class CreateVoiceCommandDto {
  @IsUUID()
  messId: string;

  @IsOptional()
  @Transform(lowerString)
  @IsIn(SUPPORTED_LOCALES)
  locale?: AppLocale;

  /**
   * Keep this optional. When omitted/auto, Groq detects the spoken language.
   * This is important because UI locale and spoken language are not always the same.
   */
  @IsOptional()
  @Transform(lowerString)
  @IsIn(SUPPORTED_SPEECH_LANGUAGES)
  speechLanguage?: SpeechLanguage;

  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;
}

export class ConfirmAiCommandDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class AiCapabilitiesQueryDto {
  @IsOptional()
  @Transform(lowerString)
  @IsIn(SUPPORTED_LOCALES)
  locale?: AppLocale;
}



// import { Transform } from 'class-transformer';
// import {
//   IsIn,
//   IsNotEmpty,
//   IsObject,
//   IsOptional,
//   IsString,
//   IsUUID,
//   MaxLength,
//   MinLength,
// } from 'class-validator';

// const SUPPORTED_LOCALES = ['en', 'bn'] as const;

// export class CreateTextCommandDto {
//   @IsUUID()
//   messId: string;

//   @IsString()
//   @IsNotEmpty()
//   @MinLength(2)
//   @MaxLength(2000)
//   text: string;

//   @IsOptional()
//   @IsIn(SUPPORTED_LOCALES)
//   locale?: 'en' | 'bn';

//   @IsOptional()
//   @IsUUID()
//   idempotencyKey?: string;
// }

// export class CreateVoiceCommandDto {
//   @IsUUID()
//   messId: string;

//   @IsOptional()
//   @IsIn(SUPPORTED_LOCALES)
//   locale?: 'en' | 'bn';

//   @IsIn(SUPPORTED_LOCALES)
//   speechLanguage: 'en' | 'bn';

//   @IsOptional()
//   @IsUUID()
//   idempotencyKey?: string;
// }

// export class ConfirmAiCommandDto {
//   @IsOptional()
//   @IsObject()
//   payload?: Record<string, unknown>;
// }

// export class AiCapabilitiesQueryDto {
//   @IsOptional()
//   @Transform(({ value }) => String(value || '').toLowerCase())
//   @IsIn(SUPPORTED_LOCALES)
//   locale?: 'en' | 'bn';
// }
