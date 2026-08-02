import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MonthlyBillModule } from '../monthly-bill/monthly-bill.module';

@Module({
  imports: [PrismaModule, JwtModule.register({}), MonthlyBillModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
