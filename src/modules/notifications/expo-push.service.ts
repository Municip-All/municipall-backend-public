import { Injectable, Logger } from '@nestjs/common';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);

  async sendBatch(messages: ExpoPushMessage[]): Promise<{ sent: number; failed: number }> {
    const valid = messages.filter((m) => m.to.startsWith('ExponentPushToken['));
    if (valid.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const chunkSize = 100;

    for (let i = 0; i < valid.length; i += chunkSize) {
      const chunk = valid.slice(i, i + chunkSize);
      try {
        const response = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        if (!response.ok) {
          this.logger.error(`Expo Push HTTP ${response.status}: ${await response.text()}`);
          failed += chunk.length;
          continue;
        }

        const tickets = (await response.json()) as { data?: ExpoPushTicket[] };
        const results = tickets.data ?? [];
        for (const ticket of results) {
          if (ticket.status === 'ok') sent += 1;
          else {
            failed += 1;
            this.logger.warn(`Expo ticket error: ${ticket.message ?? 'unknown'}`);
          }
        }
      } catch (err) {
        failed += chunk.length;
        this.logger.error('Expo Push request failed', err instanceof Error ? err.message : err);
      }
    }

    return { sent, failed };
  }
}
