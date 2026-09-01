import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../core/decorators/public.decorator';
import { RequirePermissions } from '../../core/decorators/require-permissions.decorator';
import { Permission } from '../../core/auth/permissions';
import { AiEngineService } from './ai-engine.service';
import { CitoyenChatDto } from './dto/citoyen-chat.dto';
import { AgentChatDto } from './dto/agent-chat.dto';

interface AgentChatRequest extends Request {
  tenantId?: string;
  user?: { sub: number; role?: string; cityId?: string };
}

@ApiTags('ai')
@Controller('ai')
export class AiEngineController {
  constructor(private readonly aiEngineService: AiEngineService) {}

  @Public()
  @Post('chat/citoyen')
  @HttpCode(200)
  @ApiOperation({ summary: 'Chatbot citoyen MuniBot (proxy service IA)' })
  async chatCitoyen(@Body() dto: CitoyenChatDto, @Headers('x-tenant-id') headerTenant?: string) {
    const tenant_id =
      dto.tenant_id ??
      (typeof headerTenant === 'string' && headerTenant ? headerTenant : undefined);
    const result = await this.aiEngineService.chatCitoyen(dto.user_id, dto.message, tenant_id);
    if (!result) {
      throw new ServiceUnavailableException('Service IA momentanément indisponible');
    }
    return result;
  }

  @RequirePermissions(Permission.REPORTS_READ)
  @Post('chat/agent')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agent IA de mairie (proxy service IA, staff uniquement)' })
  async chatAgent(@Req() req: AgentChatRequest, @Body() dto: AgentChatDto) {
    const tenant_id = req.tenantId ?? req.user?.cityId ?? dto.tenant_id;
    const result = await this.aiEngineService.chatAgent(dto.question, tenant_id);
    if (!result) {
      throw new ServiceUnavailableException('Service IA momentanément indisponible');
    }
    return result;
  }
}
