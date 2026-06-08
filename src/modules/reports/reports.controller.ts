import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Param,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReplyReportDto } from './dto/reply-report.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

interface ReportRequest extends Request {
  tenantId?: string;
  user?: { sub: number; role?: string };
}

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a new report' })
  @ApiResponse({ status: 201, description: 'Report successfully created.' })
  async createReport(@Req() req: ReportRequest, @Body() reportData: CreateReportDto) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub ?? reportData.userId;
    return this.reportsService.create(tenantId, { ...reportData, userId });
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports for the current city' })
  async getAll(@Req() req: ReportRequest) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.reportsService.findAll(tenantId);
  }

  @Get('clustered')
  @ApiOperation({ summary: 'Get clustered reports for map view' })
  async getClustered(@Body() bounds: unknown) {
    return this.reportsService.getClusteredReports(bounds);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get report detail with citizen info and messages' })
  async getDetail(@Req() req: ReportRequest, @Param('id', ParseIntPipe) id: number) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.reportsService.findDetail(tenantId, id);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a report (agent or citizen)' })
  async reply(
    @Req() req: ReportRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReplyReportDto,
  ) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException();
    }
    const userRole = req.user?.role?.toLowerCase() ?? '';
    const role = userRole === 'agent' || userRole === 'admin' ? 'agent' : 'citizen';
    return this.reportsService.addMessage(tenantId, id, userId, role, body.body);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report status' })
  async updateStatus(
    @Req() req: ReportRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.reportsService.updateStatus(id, status, tenantId);
  }
}
