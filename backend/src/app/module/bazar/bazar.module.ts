import { Module } from '@nestjs/common';
import { BazarService } from './bazar.service';
import { BazarController } from './bazar.controller';

@Module({
  controllers: [BazarController],
  providers: [BazarService],
  exports: [BazarService],
})
export class BazarModule {}