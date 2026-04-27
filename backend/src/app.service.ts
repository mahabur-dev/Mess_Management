import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      name: 'Mess Management Backend API',
      status: 'ok',
      swaggerUrl: `/api/docs`,
      version: '1.0.0',
    };
  }
}
