import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/decorators/public.decorator';
import { AiEngineService } from './ai-engine.service';
import { CitoyenChatDto } from './dto/citoyen-chat.dto';

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
}
