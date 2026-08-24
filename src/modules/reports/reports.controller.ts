import {
  Controller,
  Get,
  Post,
  Body,
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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermissions } from '../../core/decorators/require-permissions.decorator';
import { Permission } from '../../core/auth/permissions';
import { resolveReportSenderRole } from '../../core/auth/roles';

interface ReportRequest extends Request {
  tenantId?: string;
  user?: { sub: number; role?: string; cityId?: string };
}

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @RequirePermissions(Permission.REPORTS_CREATE)
  @Post()
  @ApiOperation({ summary: 'Submit a new report (requires authentication)' })
  @ApiResponse({ status: 201, description: 'Report successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  async createReport(@Req() req: ReportRequest, @Body() reportData: CreateReportDto) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub ?? reportData.userId;
    if (!userId) {
      throw new UnauthorizedException('Authentication required to submit a report.');
    }
    return this.reportsService.create(tenantId, { ...reportData, userId }, userId);
  }

  @RequirePermissions(Permission.REPORTS_READ)
  @Get()
  @ApiOperation({ summary: 'List reports (staff: city-wide, citizen: own reports)' })
  async getAll(@Req() req: ReportRequest) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    const role = req.user?.role ?? 'citizen';
    if (resolveReportSenderRole(role) === 'citizen') {
      if (!userId) {
        throw new UnauthorizedException('Session expirée. Reconnectez-vous.');
      }
      return this.reportsService.findByUser(tenantId, userId);
    }
    return this.reportsService.findAll(tenantId);
  }

  @RequirePermissions(Permission.REPORTS_READ)
  @Get('mine')
  @ApiOperation({ summary: 'Mes signalements (citoyen)' })
  async getMine(@Req() req: ReportRequest) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Session expirée. Reconnectez-vous.');
    }
    return this.reportsService.findByUser(tenantId, userId);
  }

  @RequirePermissions(Permission.REPORTS_READ)
  @Get('clustered')
  @ApiOperation({ summary: 'Get clustered reports for map view' })
  async getClustered(@Req() _req: ReportRequest) {
    return this.reportsService.getClusteredReports(_req.query);
  }

  @RequirePermissions(Permission.REPORTS_READ)
  @Get(':id')
  @ApiOperation({ summary: 'Get report detail with citizen info and messages' })
  async getDetail(@Req() req: ReportRequest, @Param('id', ParseIntPipe) id: number) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Session expirée. Reconnectez-vous.');
    }
    return this.reportsService.findDetail(tenantId, id, userId, req.user?.role ?? 'citizen');
  }

  @RequirePermissions(Permission.REPORTS_REPLY)
  @Post(':id/messages')
  @ApiOperation({ summary: 'Reply to a report (agent or citizen)' })
  async reply(
    @Req() req: ReportRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ReplyReportDto,
  ) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Session expirée. Reconnectez-vous.');
    }
    return this.reportsService.addMessage(
      tenantId,
      id,
      userId,
      body.body,
      req.user?.role ?? 'citizen',
    );
  }

  @RequirePermissions(Permission.REPORTS_STATUS)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update report status' })
  async updateStatus(
    @Req() req: ReportRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Session expirée. Reconnectez-vous.');
    }
    return this.reportsService.updateStatus(id, status, tenantId, userId);
  }
}
