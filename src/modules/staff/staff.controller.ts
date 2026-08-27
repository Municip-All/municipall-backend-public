import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { RequirePermissions } from '../../core/decorators/require-permissions.decorator';
import { Permission } from '../../core/auth/permissions';
import { Public } from '../../core/decorators/public.decorator';
import { AcceptInvitationDto, CreateStaffInvitationDto } from './dto/create-staff-invitation.dto';
import { PaginationDto } from '../../shared/dtos/pagination.dto';

interface StaffRequest extends Request {
  user?: { sub: number; role: string; cityId?: string };
  tenantId?: string;
}

@ApiTags('staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('team')
  @RequirePermissions(Permission.TEAM_READ)
  @ApiOperation({ summary: "Liste des membres de l'équipe mairie" })
  async listTeam(@Req() req: StaffRequest) {
    const tenantId = req.tenantId ?? req.user?.cityId ?? '';
    return this.staffService.listTeam(tenantId);
  }

  @Post('invitations')
  @RequirePermissions(Permission.TEAM_MANAGE)
  @ApiOperation({ summary: 'Inviter un assistant ou agent (maire)' })
  async createInvitation(@Req() req: StaffRequest, @Body() dto: CreateStaffInvitationDto) {
    const tenantId = req.tenantId ?? req.user?.cityId ?? '';
    const userId = req.user?.sub;
    if (!userId) throw new UnauthorizedException('User required');
    return this.staffService.createInvitation(tenantId, userId, dto);
  }

  @Public()
  @Get('invitations/preview')
  @ApiOperation({ summary: 'Aperçu invitation (lien public)' })
  async previewInvitation(@Query('token') token: string) {
    return this.staffService.getInvitationPreview(token);
  }

  @Public()
  @Post('invitations/accept')
  @ApiOperation({ summary: 'Accepter une invitation équipe mairie' })
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.staffService.acceptInvitation(dto);
  }

  @Get('team/kpis')
  @RequirePermissions(Permission.TEAM_KPIS)
  @ApiOperation({ summary: 'KPIs par agent (maire)' })
  async teamKpis(
    @Req() req: StaffRequest,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const tenantId = req.tenantId ?? req.user?.cityId ?? '';
    return this.staffService.getTeamKpis(tenantId, days);
  }

  @Get('team/activity')
  @RequirePermissions(Permission.TEAM_KPIS)
  @ApiOperation({ summary: "Journal d'activité de l'équipe (maire)" })
  async teamActivity(@Req() req: StaffRequest, @Query() pagination: PaginationDto) {
    const tenantId = req.tenantId ?? req.user?.cityId ?? '';
    const limit = pagination.limit ?? 50;
    return this.staffService.getTeamActivity(tenantId, limit);
  }
}
