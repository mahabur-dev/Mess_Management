export type CommandResponseFormat = 'json_schema' | 'json_object' | 'text';
export type SpeechResponseFormat = 'json' | 'text' | 'verbose_json' | 'none';
export type SupportedSpeechLanguage = 'auto' | 'en' | 'bn';

const AUTO_TRANSCRIPTION_PROMPT = [
  'Transcribe verbatim; do not translate, answer, summarize, or rewrite.',
  'Speech may be Bangla, English, Banglish, or mixed.',
  'Preserve names, item names, numbers, quantities, units, and monetary amounts.',
  'Use digits for clear spoken monetary numbers.',
  'Context: Bangladeshi mess expenses, bazar, utilities, deposits, and meals.',
  'Vocabulary: taka, tk, kg, bazar, alu, piyaj, current, internet, WiFi, gas, pani, meal, nasta, lunch, dinner, jama, deposit.',
].join(' ');

export function buildTranscriptionPrompt(
  language: SupportedSpeechLanguage,
  configuredPrompt?: string,
): string {
  if (configuredPrompt?.trim()) return configuredPrompt.trim();

  if (language === 'bn') {
    return `${AUTO_TRANSCRIPTION_PROMPT} Prefer Bangla script for Bangla speech, but preserve any English or Banglish words actually spoken.`;
  }

  if (language === 'en') {
    return `${AUTO_TRANSCRIPTION_PROMPT} Prefer English text for English speech, but preserve any Bangla or Banglish words actually spoken.`;
  }

  return AUTO_TRANSCRIPTION_PROMPT;
}

export function normalizeApiBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

export function buildApiUrl(baseUrl: string, endpointPath: string): string {
  const base = normalizeApiBaseUrl(baseUrl);
  const path = endpointPath.trim().replace(/^\/+/, '');
  const url = path ? `${base}/${path}` : base;

  // Validate configuration before a request is attempted.
  new URL(url);
  return url;
}

export function resolveCommandResponseFormat(
  configuredFormat: string | undefined,
  baseUrl: string,
): CommandResponseFormat {
  const format = configuredFormat?.trim().toLowerCase() || 'auto';

  if (format === 'auto') {
    return /(^|\.)api\.deepseek\.com$/i.test(new URL(baseUrl).hostname)
      ? 'json_object'
      : 'json_schema';
  }

  if (format === 'none') return 'text';
  if (
    format === 'json_schema' ||
    format === 'json_object' ||
    format === 'text'
  ) {
    return format;
  }

  throw new Error(
    `Unsupported AI_COMMAND_RESPONSE_FORMAT "${configuredFormat}". Use auto, json_schema, json_object, or text.`,
  );
}

export function buildResponseFormat(
  format: CommandResponseFormat,
  schema: object,
): object | undefined {
  if (format === 'json_schema') {
    return {
      type: 'json_schema',
      json_schema: {
        name: 'mess_command',
        strict: true,
        schema,
      },
    };
  }

  if (format === 'json_object') return { type: 'json_object' };
  return undefined;
}

export function resolveSpeechResponseFormat(
  configuredFormat: string | undefined,
): SpeechResponseFormat {
  const format = configuredFormat?.trim().toLowerCase() || 'json';

  if (
    format === 'json' ||
    format === 'text' ||
    format === 'verbose_json' ||
    format === 'none'
  ) {
    return format;
  }

  throw new Error(
    `Unsupported AI_SPEECH_RESPONSE_FORMAT "${configuredFormat}". Use json, text, verbose_json, or none.`,
  );
}

export function extractTranscript(
  responseBody: string,
  format: SpeechResponseFormat,
): string {
  if (format === 'text') return responseBody.trim();

  if (format === 'none') {
    try {
      const body = JSON.parse(responseBody) as { text?: unknown };
      if (typeof body.text === 'string') return body.text.trim();
    } catch {
      // A provider without response_format support may return plain text.
    }
    return responseBody.trim();
  }

  const body = JSON.parse(responseBody) as { text?: unknown };
  return typeof body.text === 'string' ? body.text.trim() : '';
}
