import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default {
  port: process.env.PORT || 5001,
  env: process.env.NODE_ENV || 'development',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  resendApiKey: process.env.RESEND_API_KEY,

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
    accessTokenExpires: process.env.ACCESS_TOKEN_EXPIRES || '7d',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET as string,
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || '90d',
  },

  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  email: {
    resendFrom:
      process.env.RESEND_FROM_EMAIL || 'Mess Management <onboarding@resend.dev>',
  },
  webPush: {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY as string,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY as string,
    vapidSubject: process.env.VAPID_SUBJECT as string,
  },

  fcm: {
    projectId: process.env.FCM_PROJECT_ID,
    clientEmail: process.env.FCM_CLIENT_EMAIL,
    privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },

  firebaseAuth: {
    projectId:
      process.env.FIREBASE_AUTH_PROJECT_ID || process.env.FCM_PROJECT_ID,
    clientEmail:
      process.env.FIREBASE_AUTH_CLIENT_EMAIL || process.env.FCM_CLIENT_EMAIL,
    privateKey: (
      process.env.FIREBASE_AUTH_PRIVATE_KEY || process.env.FCM_PRIVATE_KEY
    )?.replace(/\\n/g, '\n'),
  },

  aiAutomation: {
    enabled:
      process.env.AI_AUTOMATION_ENABLED === undefined
        ? (process.env.NODE_ENV || 'development') !== 'production'
        : process.env.AI_AUTOMATION_ENABLED.toLowerCase() === 'true',
    commandProvider: process.env.AI_COMMAND_PROVIDER || 'groq',
    commandApiKey: process.env.AI_COMMAND_API_KEY || process.env.GROQ_API_KEY,
    commandBaseUrl:
      process.env.AI_COMMAND_BASE_URL || 'https://api.groq.com/openai/v1',
    commandPath: process.env.AI_COMMAND_PATH || '/chat/completions',
    commandModel:
      process.env.AI_COMMAND_MODEL ||
      process.env.GROQ_COMMAND_MODEL ||
      'openai/gpt-oss-20b',
    commandResponseFormat: process.env.AI_COMMAND_RESPONSE_FORMAT || 'auto',
    commandTimeoutMs: positiveInteger(process.env.AI_COMMAND_TIMEOUT_MS, 20_000),
    previewSlowLogMs: positiveInteger(process.env.AI_PREVIEW_SLOW_LOG_MS, 1_000),
    speechProvider: process.env.AI_SPEECH_PROVIDER || 'groq',
    speechApiKey: process.env.AI_SPEECH_API_KEY || process.env.GROQ_API_KEY,
    speechBaseUrl:
      process.env.AI_SPEECH_BASE_URL || 'https://api.groq.com/openai/v1',
    speechPath: process.env.AI_SPEECH_PATH || '/audio/transcriptions',
    speechModel:
      process.env.AI_SPEECH_MODEL ||
      process.env.GROQ_SPEECH_MODEL ||
      'whisper-large-v3-turbo',
    speechResponseFormat: process.env.AI_SPEECH_RESPONSE_FORMAT || 'json',
    speechTemperature:
      process.env.AI_SPEECH_TEMPERATURE === undefined
        ? '0'
        : process.env.AI_SPEECH_TEMPERATURE,
    speechSendLanguage:
      process.env.AI_SPEECH_SEND_LANGUAGE?.toLowerCase() !== 'false',
    speechSendPrompt:
      process.env.AI_SPEECH_SEND_PROMPT?.toLowerCase() !== 'false',
    speechPrompt: process.env.AI_SPEECH_PROMPT?.trim() || undefined,
    speechTimeoutMs: positiveInteger(process.env.AI_SPEECH_TIMEOUT_MS, 30_000),
    maxAudioBytes: Number(process.env.AI_MAX_AUDIO_BYTES) || 10 * 1024 * 1024,
    retentionDays: Number(process.env.AI_COMMAND_RETENTION_DAYS) || 30,
    maxRequestsPerMinute: Number(process.env.AI_MAX_REQUESTS_PER_MINUTE) || 10,
    maxCommandsPerDay: Number(process.env.AI_MAX_COMMANDS_PER_DAY) || 100,
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
