import { Module } from '@nestjs/common';
import { BazarService } from './bazar.service';
import { BazarController } from './bazar.controller';
import { BazarScheduleController } from './bazar-schedule.controller';
import { BazarScheduleService } from './bazar-schedule.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [BazarController, BazarScheduleController],
  providers: [BazarService, BazarScheduleService],
  exports: [BazarService, BazarScheduleService],
})
export class BazarModule {}
