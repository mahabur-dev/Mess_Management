import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('public/messes')
  @ApiOperation({ summary: 'Public: Get all active messes for landing page' })
  async getPublicMesses() {
    const data = await this.appService.getPublicMesses();
    return { message: 'Messes fetched successfully', data };
  }

  @Get('public/plans')
  @ApiOperation({ summary: 'Public: Get subscription plans with pricing' })
  async getSubscriptionPlans() {
    const data = await this.appService.getSubscriptionPlans();
    return { message: 'Plans fetched successfully', data };
  }
}
