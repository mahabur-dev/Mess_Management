import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { catchError, map, Observable, throwError } from 'rxjs';

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
          return {
            statusCode: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            message: responseRecord.message || null,
            meta: responseRecord.meta || null,
            ...Object.fromEntries(
              Object.entries(responseRecord).filter(
                ([key]) => !['message', 'meta', 'data'].includes(key),
              ),
            ),
            data: responseRecord.data,
          };
        }

        return {
          statusCode: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          message: 'Request successfully completed',
          meta: null,
          data: response,
        };
      }),
      catchError((error) => throwError(() => error)),
    );
  }
}
