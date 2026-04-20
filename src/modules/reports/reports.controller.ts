import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new report with GPS coordinates' })
  createReport(@Body() _reportData: any) {
    // Logic for report creation with boundary check
    return { status: 'pending', id: '123' };
  }

  @Get('clustered')
  getClustered(@Body() bounds: any) {
    return this.reportsService.getClusteredReports(bounds);
  }
}
