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
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ContactMessagesService } from './contact-messages.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

interface AuthUser {
  sub: number;
  email: string;
  role: string;
}

type AuthedRequest = Request & { tenantId?: string; user?: AuthUser };

@ApiTags('contact-messages')
@Controller('contact-messages')
export class ContactMessagesController {
  constructor(private readonly contactMessagesService: ContactMessagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Envoyer un message à la mairie' })
  async create(@Req() req: AuthedRequest, @Body() dto: CreateContactMessageDto) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return this.contactMessagesService.create(tenantId, userId, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mes messages envoyés à la mairie' })
  async findMine(@Req() req: AuthedRequest) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }
    return this.contactMessagesService.findByUser(tenantId, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tous les messages contact de la ville (agents)' })
  async findAllForCity(@Req() req: AuthedRequest) {
    if (req.user?.role !== 'agent' && req.user?.role !== 'admin') {
      throw new ForbiddenException('Accès réservé aux agents');
    }
    const tenantId = req.tenantId ?? 'city-1';
    return this.contactMessagesService.findAllForTenant(tenantId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mettre à jour le statut d’un message (agents)' })
  async updateStatus(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    if (req.user?.role !== 'agent' && req.user?.role !== 'admin') {
      throw new ForbiddenException('Accès réservé aux agents');
    }
    const tenantId = req.tenantId ?? 'city-1';
    return this.contactMessagesService.updateStatus(id, tenantId, status);
  }
}
