import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ValidationError } from 'class-validator';
import config from '../config';

export interface TErrorSource {
  path: string | number;
  message: string;
}

export interface TErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errorSources: TErrorSource[];
  stack?: string | null;
}

const handleClassValidatorErrors = (errors: ValidationError[]) => {
  const errorSources: TErrorSource[] = errors.flatMap((err) =>
    Object.values(err.constraints || {}).map((msg) => ({
      path: err.property,
      message: msg,
    })),
  );
  return {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Validation failed',
    errorSources,
  };
};

const handlePrismaKnownError = (
  err: Prisma.PrismaClientKnownRequestError,
): { statusCode: number; message: string; errorSources: TErrorSource[] } => {
  switch (err.code) {
    case 'P2002': {
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `Duplicate value: ${field} already exists`,
        errorSources: [{ path: field, message: `${field} must be unique` }],
      };
    }
    case 'P2025': {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Record not found',
        errorSources: [{ path: '', message: err.message }],
      };
    }
    case 'P2003': {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Related record not found',
        errorSources: [{ path: '', message: err.message }],
      };
    }
    case 'P2014': {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Relation violation',
        errorSources: [{ path: '', message: err.message }],
      };
    }
    default:
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database error',
        errorSources: [{ path: '', message: err.message }],
      };
  }
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

  catch(err: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const isDev = config.env === 'development';

    this.logger.error(
      `[${request.method}] ${request.url}`,
      err instanceof Error ? err.stack : String(err),
    );

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Something went wrong!';
    let errorSources: TErrorSource[] = [
      { path: '', message: 'Something went wrong' },
    ];

    // 1. Raw class-validator ValidationError[]
    if (
      Array.isArray(err) &&
      err.length > 0 &&
      err[0] instanceof ValidationError
    ) {
      ({ statusCode, message, errorSources } = handleClassValidatorErrors(
        err as ValidationError[],
      ));
    }

    // 2. NestJS HttpException (may wrap class-validator errors)
    else if (err instanceof HttpException) {
      const res = err.getResponse() as any;
      if (
        typeof res === 'object' &&
        Array.isArray(res.message) &&
        typeof res.message[0] === 'string'
      ) {
        statusCode = err.getStatus();
        message = 'Validation failed';
        errorSources = res.message.map((msg: string) => ({
          path: '',
          message: msg,
        }));
      } else {
        statusCode = err.getStatus();
        message =
          typeof res === 'string' ? res : (res?.message ?? 'Request failed');
        errorSources = [{ path: '', message }];
      }
    }

    // 3. Prisma Known Request Error (P2002, P2025, P2003, etc.)
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
      ({ statusCode, message, errorSources } = handlePrismaKnownError(err));
    }

    // 4. Prisma Validation Error
    else if (err instanceof Prisma.PrismaClientValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided to database';
      errorSources = [{ path: '', message: (err as any).message }];
    }

    // 5. Generic JS Error
    else if (err instanceof Error) {
      message = err.message;
      errorSources = [{ path: '', message: err.message }];
    }

    const body: TErrorResponse = {
      success: false,
      statusCode,
      message,
      errorSources,
      stack: isDev && err instanceof Error ? err.stack : null,
    };

    httpAdapter.reply(response, body, statusCode);
  }
}
