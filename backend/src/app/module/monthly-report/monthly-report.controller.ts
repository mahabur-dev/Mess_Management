import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import {
  GenerateMonthlyReportDto,
  MonthlyReportMonthQueryDto,
  MonthlyReportPdfQueryDto,
  UpdateMonthlyReportSettingDto,
} from './dto/monthly-report.dto';
import { MonthlyReportService } from './monthly-report.service';

@ApiTags('Monthly Report')
@ApiBearerAuth('access-token')
@Controller('monthly-reports')
export class MonthlyReportController {
  constructor(private readonly reportService: MonthlyReportService) {}

  @Get('settings/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get monthly report settings for a mess' })
  async getSettings(@Param('messId') messId: string, @Req() req: Request) {
    const data = await this.reportService.getSettings(
      messId,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Monthly report settings fetched successfully', data };
  }

  @Patch('settings/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Update monthly report settings' })
  async updateSettings(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Body() dto: UpdateMonthlyReportSettingDto,
  ) {
    const data = await this.reportService.updateSettings(
      messId,
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Monthly report settings updated successfully', data };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get a monthly report for a mess and month' })
  async findForMess(
    @Param('messId') messId: string,
    @Req() req: Request,
    @Query() query: MonthlyReportMonthQueryDto,
  ) {
    const data = await this.reportService.findForMess(
      messId,
      query.month,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Monthly report fetched successfully', data };
  }

  @Post('generate')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Generate or refresh a draft monthly report' })
  async generate(@Req() req: Request, @Body() dto: GenerateMonthlyReportDto) {
    const data = await this.reportService.generate(
      req.user!.id,
      req.user!.role,
      dto,
    );
    return { message: 'Monthly report draft generated successfully', data };
  }

  @Post(':id/finalize')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Finalize an immutable monthly report snapshot' })
  async finalize(@Param('id') id: string, @Req() req: Request) {
    const data = await this.reportService.finalize(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Monthly report finalized successfully', data };
  }

  @Post(':id/retry-deliveries')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Retry failed monthly report emails' })
  async retryDeliveries(@Param('id') id: string, @Req() req: Request) {
    const data = await this.reportService.retryDeliveries(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Monthly report email retry completed', data };
  }

  @Get(':id/pdf')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Download the finalized monthly report PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @Req() req: Request,
    @Query() query: MonthlyReportPdfQueryDto,
    @Res() res: Response,
  ) {
    const file = await this.reportService.renderPdf(
      id,
      req.user!.id,
      req.user!.role,
      query.locale,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="' + file.filename + '"',
    );
    res.setHeader('Content-Length', file.buffer.length);
    res.send(file.buffer);
  }

  @Get(':id')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Get a monthly report by ID' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const data = await this.reportService.findOne(
      id,
      req.user!.id,
      req.user!.role,
    );
    return { message: 'Monthly report fetched successfully', data };
  }
}
