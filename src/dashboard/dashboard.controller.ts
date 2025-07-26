import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.EDITOR, Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(@Request() req: any, @Query() query: any) {
    return this.dashboardService.getDashboardStats(req.user.role, query);
  }

  @Get('events/stats')
  async getDetailedEventStats(@Request() req: any, @Query('eventId') eventId?: string) {
    return this.dashboardService.getDetailedEventStats(req.user.role, eventId);
  }
}
