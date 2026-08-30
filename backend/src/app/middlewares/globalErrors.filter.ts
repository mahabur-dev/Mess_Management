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
import {
  ERROR_CODES,
  errorCodeForStatus,
  type ErrorCode,
} from '../errors/error-codes';
import {
  errorMessageContract,
  safeErrorMessage,
  type ApiMessageParams,
} from '../contracts/api-message.contract';

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
  code: ErrorCode;
  params: ApiMessageParams;
}

type NormalizedError = {
  statusCode: number;
  message: string;
  errorSources: TErrorSource[];
  code: ErrorCode;
  params?: ApiMessageParams;
};

const handleClassValidatorErrors = (errors: ValidationError[]): NormalizedError => {
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
    code: ERROR_CODES.VALIDATION_FAILED,
    params: { fieldCount: errorSources.length },
  };
};

const handlePrismaKnownError = (
  err: Prisma.PrismaClientKnownRequestError,
): NormalizedError => {
  switch (err.code) {
    case 'P2002': {
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      return {
        statusCode: HttpStatus.CONFLICT,
        message: `Duplicate value: ${field} already exists`,
        errorSources: [{ path: field, message: `${field} must be unique` }],
        code: ERROR_CODES.RESOURCE_CONFLICT,
        params: { field },
      };
    }
    case 'P2025':
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Record not found',
        errorSources: [{ path: '', message: err.message }],
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
      };
    case 'P2003':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Related record not found',
        errorSources: [{ path: '', message: err.message }],
        code: ERROR_CODES.RELATED_RESOURCE_NOT_FOUND,
      };
    case 'P2014':
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Relation violation',
        errorSources: [{ path: '', message: err.message }],
        code: ERROR_CODES.RELATION_CONFLICT,
      };
    default:
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database error',
        errorSources: [{ path: '', message: err.message }],
        code: ERROR_CODES.DATABASE_ERROR,
      };
  }
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

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

    let normalized: NormalizedError = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Something went wrong!',
      errorSources: [{ path: '', message: 'Something went wrong' }],
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    };

    if (
      Array.isArray(err) &&
      err.length > 0 &&
      err[0] instanceof ValidationError
    ) {
      normalized = handleClassValidatorErrors(err as ValidationError[]);
    } else if (err instanceof HttpException) {
      const exceptionResponse = err.getResponse() as unknown;
      const statusCode = err.getStatus();
      if (
        exceptionResponse &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse &&
        Array.isArray(exceptionResponse.message) &&
        typeof exceptionResponse.message[0] === 'string'
      ) {
        normalized = {
          statusCode,
          message: 'Validation failed',
          errorSources: exceptionResponse.message.map((message: string) => ({
            path: '',
            message,
          })),
          code: ERROR_CODES.VALIDATION_FAILED,
          params: { fieldCount: exceptionResponse.message.length },
        };
      } else {
        const responseRecord =
          exceptionResponse && typeof exceptionResponse === 'object'
            ? (exceptionResponse as Record<string, unknown>)
            : null;
        const message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : typeof responseRecord?.message === 'string'
              ? responseRecord.message
              : 'Request failed';
        normalized = {
          statusCode,
          message,
          errorSources: [{ path: '', message }],
          code:
            typeof responseRecord?.code === 'string'
              ? responseRecord.code
              : errorCodeForStatus(statusCode),
          params:
            responseRecord?.params &&
            typeof responseRecord.params === 'object' &&
            !Array.isArray(responseRecord.params)
              ? (responseRecord.params as ApiMessageParams)
              : {},
        };
      }
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
      normalized = handlePrismaKnownError(err);
    } else if (err instanceof Prisma.PrismaClientValidationError) {
      normalized = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid data provided to database',
        errorSources: [{ path: '', message: err.message }],
        code: ERROR_CODES.BAD_REQUEST,
      };
    } else if (err instanceof Error) {
      normalized = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: safeErrorMessage(HttpStatus.INTERNAL_SERVER_ERROR),
        errorSources: [
          {
            path: '',
            message: isDev ? err.message : safeErrorMessage(HttpStatus.INTERNAL_SERVER_ERROR),
          },
        ],
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      };
    }

    const contract = errorMessageContract({
      statusCode: normalized.statusCode,
      message: normalized.message,
      code: normalized.code,
      params: normalized.params,
    });

    const body: TErrorResponse = {
      success: false,
      ...normalized,
      ...contract,
      stack: isDev && err instanceof Error ? err.stack : null,
    };

    httpAdapter.reply(response, body, normalized.statusCode);
  }
}
