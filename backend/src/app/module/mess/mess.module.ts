import { Module } from '@nestjs/common';
import { MessService } from './mess.service';
import { MessController } from './mess.controller';

@Module({
  controllers: [MessController],
  providers: [MessService],
  exports: [MessService],
})
export class MessModule {}
