import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { MonthlyBillModule } from '../monthly-bill/monthly-bill.module';

@Module({
  imports: [PrismaModule, JwtModule.register({}), MonthlyBillModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  // imports: [MonthlyBillModule],
})
export class PaymentModule {}
