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
import { ContactTicketsService } from './contact-tickets.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { ReplyContactTicketDto } from './dto/reply-contact-ticket.dto';

interface AuthUser {
  sub: number;
  email: string;
  role: string;
}

type AuthedRequest = Request & { tenantId?: string; user?: AuthUser };

@ApiTags('contact-tickets')
@Controller('contact-tickets')
export class ContactTicketsController {
  constructor(private readonly contactTicketsService: ContactTicketsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ouvrir une conversation avec la mairie' })
  async create(@Req() req: AuthedRequest, @Body() dto: CreateContactMessageDto) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.create(tenantId, userId, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mes conversations' })
  async findMine(@Req() req: AuthedRequest) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.findByUser(tenantId, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toutes les conversations (agents)' })
  async findAllForCity(@Req() req: AuthedRequest) {
    if (req.user?.role !== 'agent' && req.user?.role !== 'admin') {
      throw new ForbiddenException('Accès réservé aux agents');
    }
    const tenantId = req.tenantId ?? 'city-1';
    return this.contactTicketsService.findAllForTenant(tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Détail conversation + messages' })
  async findOne(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    const role = req.user?.role ?? 'citizen';
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.findById(id, tenantId, userId, role);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Répondre dans la conversation' })
  async reply(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyContactTicketDto,
  ) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    const role = req.user?.role ?? 'citizen';
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.reply(id, tenantId, userId, role, dto);
  }

  @Patch(':id/close')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Clôturer la conversation (agents)' })
  async close(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    if (req.user?.role !== 'agent' && req.user?.role !== 'admin') {
      throw new ForbiddenException('Accès réservé aux agents');
    }
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.close(id, tenantId, userId);
  }
}

/** @deprecated Utiliser contact-tickets */
@Controller('contact-messages')
export class ContactMessagesLegacyController {
  constructor(private readonly contactTicketsService: ContactTicketsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: AuthedRequest, @Body() dto: CreateContactMessageDto) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.create(tenantId, userId, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Req() req: AuthedRequest) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.findByUser(tenantId, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: AuthedRequest) {
    if (req.user?.role !== 'agent' && req.user?.role !== 'admin') {
      throw new ForbiddenException('Accès réservé aux agents');
    }
    return this.contactTicketsService.findAllForTenant(req.tenantId ?? 'city-1');
  }
}
