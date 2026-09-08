export type CommandResponseFormat = 'json_schema' | 'json_object' | 'text';
export type SpeechResponseFormat = 'json' | 'text' | 'verbose_json' | 'none';
export type SupportedSpeechLanguage = 'auto' | 'en' | 'bn';

const AUTO_TRANSCRIPTION_PROMPT = [
  'Bangladeshi mess voice command with Bangla, English, or Banglish speech.',
  'Example transcript: আজকের বাজার: alu 2 kg 50 taka, piyaj 2 kg 100 taka, তেল 1 kg 200 taka. Add koro.',
  'Preserve the spoken names, item names, numbers, quantities, units, and prices.',
].join(' ');

const BANGLA_TRANSCRIPTION_PROMPT = [
  'বাংলাদেশি মেসের বাজার, খরচ, বিল, জমা ও মিলের ভয়েস ট্রান্সক্রিপশন।',
  'কথা অনুযায়ী নাম, পণ্যের নাম, সংখ্যা, পরিমাণ, একক ও দাম ঠিকভাবে লিখুন।',
  'উদাহরণ: আজকের বাজার—আলু ২ কেজি ৫০ টাকা, পেঁয়াজ ২ কেজি ১০০ টাকা, তেল ১ কেজি ২০০ টাকা। অ্যাড করো।',
  'কথায় থাকা ইংরেজি বা বাংলিশ শব্দ অপরিবর্তিত রাখুন।',
].join(' ');

const ENGLISH_TRANSCRIPTION_PROMPT = [
  'Bangladeshi mess expense, utility, deposit, and meal voice transcription.',
  'Example transcript: Today bazar: alu 2 kg 50 taka, piyaj 2 kg 100 taka, tel 1 kg 200 taka. Add koro.',
  'Preserve spoken names, item names, numbers, quantities, units, and prices.',
].join(' ');

/*
 * Whisper occasionally joins every word in a short Bangla command. Only split
 * tokens that can be fully reconstructed from this conservative domain
 * vocabulary; unknown words and names are left untouched.
 */
const BANGLA_COMMAND_WORDS = [
  'আগামীকাল', 'ইন্টারনেট', 'ইলেকট্রিসিটি', 'বিদ্যুৎ', 'কারেন্ট', 'ডিপোজিট',
  'ব্রেকফাস্ট', 'সকালের', 'দুপুরের', 'রাতের', 'খাবার', 'ডিনার', 'লাঞ্চ',
  'গতকাল', 'আজকে', 'আমাদের', 'আমাকে', 'আমার', 'আপনার', 'জন্য', 'থেকে',
  'পর্যন্ত', 'বাজার', 'খরচ', 'বিল', 'জমা', 'মিল', 'নাস্তা', 'দুপুর', 'রাত',
  'ওয়াইফাই', 'ওয়াইফাই', 'ব্রডব্যান্ড', 'গ্যাস', 'পানি', 'ভাড়া', 'ভাড়া',
  'ক্লিনার', 'পরিষ্কার', 'আলু', 'পেঁয়াজ', 'পেঁয়াজ', 'পিয়াজ', 'পিয়াজ', 'চাল',
  'ডাল', 'তেল', 'সবজি', 'মাছ', 'মাংস', 'মুরগি', 'ডিম', 'দুধ', 'লবণ', 'মসলা',
  'কেজি', 'গ্রাম', 'লিটার', 'টাকা', 'একটা', 'দুইটা', 'তিনটা', 'চারটা', 'পাঁচটা',
  'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'ছয়', 'সাত', 'আট', 'নয়', 'নয়',
  'দশ', 'বিশ', 'পঞ্চাশ', 'একশ', 'দুইশ', 'পাঁচশ', 'হাজার', 'লাখ',
  'আজ', 'আমি', 'যোগ', 'করো', 'করুন', 'করে', 'দাও', 'বাদ', 'বন্ধ', 'চালু',
  'এবং', 'আর', 'এর', 'টা',
].sort((left, right) => right.length - left.length);

function splitJoinedBanglaCommandToken(token: string): string {
  if (!/^[\u0980-\u09ff]+$/u.test(token) || token.length < 7) return token;

  const memo = new Map<number, string[] | null>();
  const splitFrom = (offset: number): string[] | null => {
    if (offset === token.length) return [];
    if (memo.has(offset)) return memo.get(offset) ?? null;

    for (const word of BANGLA_COMMAND_WORDS) {
      if (!token.startsWith(word, offset)) continue;
      const remainder = splitFrom(offset + word.length);
      if (remainder) {
        const result = [word, ...remainder];
        memo.set(offset, result);
        return result;
      }
    }

    memo.set(offset, null);
    return null;
  };

  const words = splitFrom(0);
  return words && words.length > 1 ? words.join(' ') : token;
}

export function normalizeTranscriptionText(text: string): string {
  let normalized = text
    .normalize('NFKC')
    .replace(/[\u200b\ufeff]/gu, '')
    .replace(/([\p{L}\p{M}])(\p{N})/gu, '$1 $2')
    .replace(/(\p{N})([\p{L}\p{M}])/gu, '$1 $2')
    .replace(/\s*([,;।])\s*/gu, '$1 ');

  // Apply phonetic repairs only when the sentence is clearly a purchase or
  // money command, so ordinary uses of valid words such as "আলো" stay intact.
  if (/(?:কেজি|গ্রাম|লিটার|টাকা|বাজার|খরচ|৳|\b(?:kg|taka|tk)\b)/iu.test(normalized)) {
    normalized = normalized
      .replace(/(^|[\s,;।])আলো(?=\s|[,;।]|$)/gu, '$1আলু')
      .replace(/(^|[\s,;।])(?:পিযাস|পিয়াস|পিয়াস|পিযাজ)(?=\s|[,;।]|$)/gu, '$1পেঁয়াজ')
      .replace(/(?:পন্ছাস|পন্চাস|পঞ্চাস)/gu, 'পঞ্চাশ')
      .replace(/(এক|দুই|তিন|চার|পাঁচ)\s+(?:সু|শু|শো)\s*(?:টাকা|তাকা)/gu, '$1শ টাকা')
      .replace(/(?:এট|এড|অ্যাড)\s*করো/gu, 'add');
  }

  return normalized
    .split(/\s+/u)
    .map(splitJoinedBanglaCommandToken)
    .join(' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function buildTranscriptionPrompt(
  language: SupportedSpeechLanguage,
  configuredPrompt?: string,
): string {
  if (configuredPrompt?.trim()) return configuredPrompt.trim();

  if (language === 'bn') {
    return BANGLA_TRANSCRIPTION_PROMPT;
  }

  if (language === 'en') {
    return ENGLISH_TRANSCRIPTION_PROMPT;
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
