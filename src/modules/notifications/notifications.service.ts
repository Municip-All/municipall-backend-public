import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { SendTargetedNotificationDto } from './dto/send-targeted-notification.dto';
import { ExpoPushService } from './expo-push.service';

const STAFF_ROLES = new Set(['admin', 'agent', 'agent municipal', 'mairie', 'moderator', 'staff']);

export interface SendTargetedNotificationResult {
  recipientCount: number;
  sent: number;
  failed: number;
  zones: string[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly expoPush: ExpoPushService,
  ) {}

  assertCanSendBroadcast(role: string | undefined): void {
    const normalized = (role ?? '').trim().toLowerCase();
    if (normalized === 'citoyen' || normalized === 'citizen') {
      throw new ForbiddenException('Seuls les agents municipaux peuvent envoyer des alertes.');
    }
    if (normalized && !STAFF_ROLES.has(normalized)) {
      this.logger.warn(`Broadcast allowed for role "${role}" (not in staff list)`);
    }
  }

  async registerPushToken(userId: number, expoPushToken: string): Promise<{ ok: true }> {
    await this.userRepository.update({ id: userId }, { expoPushToken });
    return { ok: true };
  }

  async sendTargetedAlert(
    tenantId: string,
    dto: SendTargetedNotificationDto,
  ): Promise<SendTargetedNotificationResult> {
    const zoneNames = dto.zones.map((z) => z.trim()).filter(Boolean);
    const recipients = await this.resolveRecipients(tenantId, zoneNames);

    const messages = recipients.map((user) => ({
      to: user.expoPushToken as string,
      title: dto.title,
      body: dto.message,
      priority: dto.type === 'urgent' ? ('high' as const) : ('default' as const),
      channelId: dto.type === 'urgent' ? 'urgent' : 'default',
      data: {
        type: 'city_alert',
        alertType: dto.type,
        cityId: tenantId,
      },
    }));

    const { sent, failed } = await this.expoPush.sendBatch(messages);

    return {
      recipientCount: recipients.length,
      sent,
      failed,
      zones: zoneNames,
    };
  }

  private async resolveRecipients(tenantId: string, zones: string[]): Promise<User[]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.cityId = :tenantId', { tenantId })
      .andWhere('user.expoPushToken IS NOT NULL')
      .andWhere("user.expoPushToken != ''");

    if (zones.length > 0) {
      const normalizedZones = zones.map((z) => z.toLowerCase());
      qb.andWhere(
        `(LOWER(user.neighborhood) IN (:...zones) OR user.neighborhood IS NULL OR user.neighborhood = '')`,
        { zones: normalizedZones },
      );
    }

    let users = await qb.getMany();

    if (users.length === 0 && zones.length > 0) {
      users = await this.userRepository
        .createQueryBuilder('user')
        .where('user.cityId = :tenantId', { tenantId })
        .andWhere('user.expoPushToken IS NOT NULL')
        .andWhere("user.expoPushToken != ''")
        .getMany();
    }

    return users;
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: Number(userId) },
    });
    if (!user?.expoPushToken) return { sent: 0, failed: 0 };
    return this.expoPush.sendBatch([
      {
        to: user.expoPushToken,
        title,
        body,
        data: { type: 'direct', ...data },
      },
    ]);
  }
}
