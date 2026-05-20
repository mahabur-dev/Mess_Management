import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
