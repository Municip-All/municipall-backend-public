import { Controller, Get, Post, Body, UseGuards, Req, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a new report' })
  @ApiResponse({ status: 201, description: 'Report successfully created.' })
  async createReport(@Req() req: any, @Body() reportData: any) {
    const tenantId = req.tenantId || 'city-1'; // Fallback for dev
    return this.reportsService.create(tenantId, reportData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports for the current city' })
  async getAll(@Req() req: any) {
    const tenantId = req.tenantId || 'city-1';
    return this.reportsService.findAll(tenantId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update report status' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.reportsService.updateStatus(id, status);
  }

  @Get('clustered')
  @ApiOperation({ summary: 'Get clustered reports for map view' })
  async getClustered(@Body() bounds: any) {
    return this.reportsService.getClusteredReports(bounds);
  }
}
