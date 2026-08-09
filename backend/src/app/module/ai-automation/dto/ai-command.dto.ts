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

const SUPPORTED_LOCALES = ['en', 'bn'] as const;

export class CreateTextCommandDto {
  @IsUUID()
  messId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2000)
  text: string;

  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  locale?: 'en' | 'bn';

  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;
}

export class CreateVoiceCommandDto {
  @IsUUID()
  messId: string;

  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  locale?: 'en' | 'bn';

  @IsIn(SUPPORTED_LOCALES)
  speechLanguage: 'en' | 'bn';

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
  @Transform(({ value }) => String(value || '').toLowerCase())
  @IsIn(SUPPORTED_LOCALES)
  locale?: 'en' | 'bn';
}
