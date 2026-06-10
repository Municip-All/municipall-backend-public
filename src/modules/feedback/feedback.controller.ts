import { Controller, Get, Post, Body, Req, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateCitizenFeedbackDto } from './dto/create-citizen-feedback.dto';
import { RequirePermissions } from '../../core/decorators/require-permissions.decorator';
import { Permission } from '../../core/auth/permissions';

interface AuthUser {
  sub: number;
  email: string;
  role: string;
}

type AuthedRequest = Request & { tenantId?: string; user?: AuthUser };

@ApiTags('feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @RequirePermissions(Permission.FEEDBACK_CREATE)
  @Post()
  @ApiOperation({ summary: 'Noter un dossier clôturé (citoyen)' })
  async create(@Req() req: AuthedRequest, @Body() dto: CreateCitizenFeedbackDto) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.feedbackService.submit(tenantId, userId, dto);
  }

  @RequirePermissions(Permission.FEEDBACK_READ)
  @Get()
  @ApiOperation({ summary: 'Liste des avis citoyens (maire uniquement)' })
  async listForMayor(@Req() req: AuthedRequest) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.feedbackService.listForMayor(tenantId);
  }

  @RequirePermissions(Permission.FEEDBACK_READ)
  @Get('summary')
  @ApiOperation({ summary: 'Synthèse satisfaction (maire uniquement)' })
  async summary(@Req() req: AuthedRequest) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.feedbackService.getSatisfactionSummary(tenantId);
  }
}
