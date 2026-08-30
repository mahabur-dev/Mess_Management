import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { catchError, map, Observable, throwError } from 'rxjs';
import { successMessageContract } from '../contracts/api-message.contract';

@Injectable()
export class UtilsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((response) => {
        if (
          response &&
          typeof response === 'object' &&
          ('data' in response || 'message' in response)
        ) {
          const responseRecord = response as Record<string, unknown>;
          const contract = successMessageContract(
            responseRecord.message,
            responseRecord.code,
            responseRecord.params,
          );
          return {
            statusCode: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            ...contract,
            meta: responseRecord.meta || null,
            ...Object.fromEntries(
              Object.entries(responseRecord).filter(
                ([key]) =>
                  !['code', 'message', 'params', 'meta', 'data'].includes(key),
              ),
            ),
            data: responseRecord.data,
          };
        }

        const contract = successMessageContract(null);
        return {
          statusCode: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          ...contract,
          meta: null,
          data: response,
        };
      }),
      catchError((error) => throwError(() => error)),
    );
  }
}
