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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.use('/api/v1/webhook', express.raw({ type: 'application/json' }));

  app.use(cookieParser());
  // app.enableCors({
  //   origin: '*',
  //   credentials: true,
  // });
  // app.enableCors({
  // origin: (origin, callback) => callback(null, true), // allow all but dynamically
  //   credentials: true,
  //   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  // });
  app.enableCors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Allow all GitHub Codespaces preview URLs + localhost
    if (
      origin.includes('.app.github.dev') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

  app.setGlobalPrefix('api/v1', {
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

//   await app.listen(process.env.PORT ?? 3000, () => {
//     console.log(
//       `Server is running on http://localhost:${process.env.PORT ?? 3000}`,
//     );
//     console.log(
//       `Swagger: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
//     );
//   });
// }
await app.listen(process.env.PORT ?? 5001, '0.0.0.0', () => {
  console.log(
    `Server is running on http://localhost:${process.env.PORT ?? 5001}`,
  );
  console.log(
    `Swagger: http://localhost:${process.env.PORT ?? 5001}/api/docs`,
  );
});
}
bootstrap().catch(console.error);
