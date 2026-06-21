import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { ContactRequestController } from './contact-request.controller';
import { ContactRequestService } from './contact-request.service';

@Module({
  imports: [NotificationModule],
  controllers: [ContactRequestController],
  providers: [ContactRequestService],
})
export class ContactRequestModule {}
