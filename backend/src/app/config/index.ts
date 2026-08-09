import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  port: process.env.PORT || 5001,
  env: process.env.NODE_ENV || 'development',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  resend_apiKey: process.env.RESEND_API_KEY as string,

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
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    address: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  },
  webPush: {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY as string,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY as string,
    vapidSubject: process.env.VAPID_SUBJECT as string,
  },

  aiAutomation: {
    enabled:
      process.env.AI_AUTOMATION_ENABLED === undefined
        ? (process.env.NODE_ENV || 'development') !== 'production'
        : process.env.AI_AUTOMATION_ENABLED.toLowerCase() === 'true',
    groqApiKey: process.env.GROQ_API_KEY,
    commandModel: process.env.GROQ_COMMAND_MODEL || 'openai/gpt-oss-20b',
    speechModel: process.env.GROQ_SPEECH_MODEL || 'whisper-large-v3-turbo',
    maxAudioBytes: Number(process.env.AI_MAX_AUDIO_BYTES) || 10 * 1024 * 1024,
    retentionDays: Number(process.env.AI_COMMAND_RETENTION_DAYS) || 30,
    maxRequestsPerMinute: Number(process.env.AI_MAX_REQUESTS_PER_MINUTE) || 10,
    maxCommandsPerDay: Number(process.env.AI_MAX_COMMANDS_PER_DAY) || 100,
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
