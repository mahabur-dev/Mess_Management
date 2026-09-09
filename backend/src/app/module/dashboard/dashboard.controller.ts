import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import AuthGuard from '../../middlewares/auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Super admin dashboard summary' })
  async adminDashboard() {
    const data = await this.dashboardService.getAdminDashboard();
    return { message: 'Admin dashboard fetched successfully', data };
  }

  @Get('admin/running-messes')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Operationally active messes' })
  async runningMesses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.dashboardService.getRunningMesses(
      Number(page) || 1,
      Number(limit) || 25,
    );
    return {
      message: 'Running messes fetched successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get('admin/running-messes/:messId')
  @UseGuards(AuthGuard('ADMIN'))
  @ApiOperation({ summary: '[ADMIN] Running mess operational details' })
  async runningMessDetails(@Param('messId') messId: string) {
    const data = await this.dashboardService.getRunningMessDetails(messId);
    return { message: 'Running mess details fetched successfully', data };
  }

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Mess dashboard summary' })
  @ApiQuery({ name: 'month', required: false, example: '2026-05-01' })
  async messDashboard(@Param('messId') messId: string, @Req() req: Request, @Query('month') month?: string) {
    const data = await this.dashboardService.getMessDashboard(messId, req.user!.id, req.user!.role, month);
    return { message: 'Mess dashboard fetched successfully', data };
  }

  @Get('mess/:messId/monthly-overview')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Daily income & expense data for monthly overview chart' })
  @ApiQuery({ name: 'month', required: false, example: '2026-05-01' })
  async getMonthlyOverview(@Param('messId') messId: string, @Req() req: Request, @Query('month') month?: string) {
    const data = await this.dashboardService.getMonthlyOverview(messId, req.user!.id, req.user!.role, month);
    return { message: 'Monthly overview fetched successfully', data };
  }

  @Get('mess/:messId/expense-breakdown')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Expense breakdown by category for pie chart' })
  @ApiQuery({ name: 'month', required: false, example: '2026-05-01' })
  async getExpenseBreakdown(@Param('messId') messId: string, @Req() req: Request, @Query('month') month?: string) {
    const data = await this.dashboardService.getExpenseBreakdown(messId, req.user!.id, req.user!.role, month);
    return { message: 'Expense breakdown fetched successfully', data };
  }

  @Get('mess/:messId/weekly-meals')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER'))
  @ApiOperation({ summary: 'Weekly meal counts (Mon-Sun) for bar chart' })
  @ApiQuery({ name: 'date', required: false, example: '2026-06-22' })
  async getWeeklyMealCount(@Param('messId') messId: string, @Req() req: Request, @Query('date') date?: string) {
    const data = await this.dashboardService.getWeeklyMealCount(messId, req.user!.id, req.user!.role, date);
    return { message: 'Weekly meal count fetched successfully', data };
  }
}
