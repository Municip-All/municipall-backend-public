import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Patch,
  Param,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContactTicketsService } from './contact-tickets.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { ReplyContactTicketDto } from './dto/reply-contact-ticket.dto';
import { RequirePermissions } from '../../core/decorators/require-permissions.decorator';
import { Permission } from '../../core/auth/permissions';

interface AuthUser {
  sub: number;
  email: string;
  role: string;
}

type AuthedRequest = Request & { tenantId?: string; user?: AuthUser };

@ApiTags('contact-tickets')
@ApiBearerAuth()
@Controller('contact-tickets')
export class ContactTicketsController {
  constructor(private readonly contactTicketsService: ContactTicketsService) {}

  @RequirePermissions(Permission.CONTACT_CREATE)
  @Post()
  @ApiOperation({ summary: 'Ouvrir une conversation avec la mairie' })
  async create(@Req() req: AuthedRequest, @Body() dto: CreateContactMessageDto) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.create(tenantId, userId, dto);
  }

  @RequirePermissions(Permission.CONTACT_READ)
  @Get('mine')
  @ApiOperation({ summary: 'Mes conversations' })
  async findMine(@Req() req: AuthedRequest) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.findByUser(tenantId, userId);
  }

  @RequirePermissions(Permission.CONTACT_READ)
  @Get()
  @ApiOperation({ summary: 'Toutes les conversations (agents)' })
  async findAllForCity(@Req() req: AuthedRequest) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.contactTicketsService.findAllForTenant(tenantId);
  }

  @RequirePermissions(Permission.CONTACT_READ)
  @Get(':id')
  @ApiOperation({ summary: 'Détail conversation + messages' })
  async findOne(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    const role = req.user?.role ?? 'citizen';
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.findById(id, tenantId, userId, role);
  }

  @RequirePermissions(Permission.CONTACT_REPLY)
  @Post(':id/messages')
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

  @RequirePermissions(Permission.CONTACT_CLOSE)
  @Patch(':id/close')
  @ApiOperation({ summary: 'Clôturer la conversation (agents)' })
  async close(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.close(id, tenantId, userId);
  }
}

/** @deprecated Utiliser contact-tickets */
@ApiBearerAuth()
@Controller('contact-messages')
export class ContactMessagesLegacyController {
  constructor(private readonly contactTicketsService: ContactTicketsService) {}

  @RequirePermissions(Permission.CONTACT_CREATE)
  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateContactMessageDto) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.create(tenantId, userId, dto);
  }

  @RequirePermissions(Permission.CONTACT_READ)
  @Get('mine')
  findMine(@Req() req: AuthedRequest) {
    const tenantId = req.tenantId ?? 'city-1';
    const userId = req.user?.sub;
    if (!userId) throw new ForbiddenException('Utilisateur non authentifié');
    return this.contactTicketsService.findByUser(tenantId, userId);
  }

  @RequirePermissions(Permission.CONTACT_READ)
  @Get()
  findAll(@Req() req: AuthedRequest) {
    return this.contactTicketsService.findAllForTenant(req.tenantId ?? 'city-1');
  }
}
