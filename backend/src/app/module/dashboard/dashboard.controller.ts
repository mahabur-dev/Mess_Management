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

  @Get('mess/:messId')
  @UseGuards(AuthGuard('ADMIN', 'MANAGER', 'MEMBER', 'ORGANIZER'))
  @ApiOperation({ summary: 'Mess dashboard summary' })
  @ApiQuery({ name: 'month', required: false, example: '2026-05-01' })
  async messDashboard(@Param('messId') messId: string, @Req() req: Request, @Query('month') month?: string) {
    const data = await this.dashboardService.getMessDashboard(messId, req.user!.id, req.user!.role, month);
    return { message: 'Mess dashboard fetched successfully', data };
  }
}
