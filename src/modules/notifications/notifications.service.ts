import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue('notifications') private readonly notificationsQueue: Queue) {}

  async sendPushNotification(userId: string, title: string, body: string) {
    // Logic to add notification job to BullMQ
    await this.notificationsQueue.add('send-push', { userId, title, body });
  }
}
