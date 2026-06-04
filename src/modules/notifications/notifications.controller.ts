import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { SendTargetedNotificationDto } from './dto/send-targeted-notification.dto';

interface AuthRequest extends Request {
  tenantId?: string;
  user?: { sub: number; email: string; role: string };
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send targeted push alert to citizens (backoffice)' })
  async sendTargeted(@Req() req: AuthRequest, @Body() body: SendTargetedNotificationDto) {
    this.notificationsService.assertCanSendBroadcast(req.user?.role);
    const tenantId = req.tenantId ?? body.cityId ?? 'city-1';
    return this.notificationsService.sendTargetedAlert(tenantId, body);
  }
}
