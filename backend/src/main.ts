import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import dotenv from 'dotenv';
import { UtilsInterceptor } from './app/utils/utils.interceptor';
import { GlobalExceptionFilter } from './app/middlewares/globalErrors.filter';
import express from 'express';
dotenv.config();

const API_PREFIX = 'api/v1';
const BODY_LIMIT = '100mb';
const HOST = '0.0.0.0';
const PORT = process.env.PORT ?? 5001;

const DEFAULT_ALLOWED_ORIGINS = [
  'https://www.messzen.com',
  'https://frontend-git-backend-mahabur1814031-8144s-projects.vercel.app',
  'https://frontend-xi-neon-98.vercel.app',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'https://messmanagement.up.railway.app',
  'https://api.messzen.com',
];

const envAllowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...envAllowedOrigins,
]);

function isAllowedCorsOrigin(origin: string) {
  if (allowedOrigins.has(origin)) return true;

  try {
    const url = new URL(origin);
    const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname);
    const isLanIp = /^192\.168\.\d{1,3}\.\d{1,3}$/.test(url.hostname);
    const isCodespace = url.hostname.endsWith('.app.github.dev');

    return isLocalhost || isLanIp || isCodespace;
  } catch {
    return false;
  }
}

function configureCors(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || isAllowedCorsOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'Accept-Language',
    ],
    exposedHeaders: ['Authorization'],
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  configureCors(app);

  app.use(`/${API_PREFIX}/webhook`, express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(express.urlencoded({ limit: BODY_LIMIT, extended: true }));
  app.use(cookieParser());

  app.setGlobalPrefix(API_PREFIX, {
    exclude: [''],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new UtilsInterceptor());
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mess Management API')
    .setDescription('Mess Management API Documentation')
    .setVersion('1.0')
    .addTag('Mess Management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Swagger: http://localhost:${PORT}/api/docs`);
  });
}
bootstrap().catch(console.error);
