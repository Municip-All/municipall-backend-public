import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendTargetedNotificationDto } from './dto/send-targeted-notification.dto';
import { RequirePermissions } from '../../core/decorators/require-permissions.decorator';
import { Permission } from '../../core/auth/permissions';

interface AuthRequest extends Request {
  tenantId?: string;
  user?: { sub: number; email: string; role: string };
}

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @RequirePermissions(Permission.NOTIFICATIONS_SEND)
  @Post('send')
  @ApiOperation({ summary: 'Send targeted push alert to citizens (backoffice)' })
  async sendTargeted(@Req() req: AuthRequest, @Body() body: SendTargetedNotificationDto) {
    const tenantId = req.tenantId ?? body.cityId ?? 'city-1';
    return this.notificationsService.sendTargetedAlert(tenantId, body);
  }
}
