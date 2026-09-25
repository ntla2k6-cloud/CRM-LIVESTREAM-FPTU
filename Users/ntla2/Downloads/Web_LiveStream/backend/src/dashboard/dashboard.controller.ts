import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('analytics/:sessionId')
  getAnalytics(@Param('sessionId') sessionId: string) {
    return this.dashboardService.getAnalytics(sessionId);
  }
}

