import { Module } from '@nestjs/common';
import { MessService } from './mess.service';
import { MessController } from './mess.controller';
import { MessRequestController } from './mess-request.controller';

@Module({
  controllers: [MessController, MessRequestController],
  providers: [MessService],
  exports: [MessService],
})
export class MessModule {}
