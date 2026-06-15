import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, JwtModule.register({}), NotificationModule],
  controllers: [NoticeController],
  providers: [NoticeService],
})
export class NoticeModule {}
