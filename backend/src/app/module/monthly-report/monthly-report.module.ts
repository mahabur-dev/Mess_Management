import { Module } from '@nestjs/common';
import { MonthlyBillModule } from '../monthly-bill/monthly-bill.module';
import { NotificationModule } from '../notification/notification.module';
import { MonthlyReportController } from './monthly-report.controller';
import { MonthlyReportPdfService } from './monthly-report-pdf.service';
import { MonthlyReportService } from './monthly-report.service';

@Module({
  imports: [MonthlyBillModule, NotificationModule],
  controllers: [MonthlyReportController],
  providers: [MonthlyReportService, MonthlyReportPdfService],
  exports: [MonthlyReportService],
})
export class MonthlyReportModule {}
