import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ComplaintController } from './complaint.controller';
import { ComplaintService } from './complaint.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [ComplaintController],
  providers: [ComplaintService],
})
export class ComplaintModule {}
