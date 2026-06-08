import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditLogInput {
  tenantId: string;
  userId: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.repository.save(this.repository.create(input));
  }

  async findByTenant(
    tenantId: string,
    options?: { since?: Date; userId?: number; limit?: number },
  ): Promise<AuditLog[]> {
    const where: Record<string, unknown> = { tenantId };
    if (options?.userId) where.userId = options.userId;
    if (options?.since) where.createdAt = MoreThanOrEqual(options.since);

    return this.repository.find({
      where,
      order: { createdAt: 'DESC' },
      take: options?.limit ?? 100,
    });
  }

  async countActionsByUser(
    tenantId: string,
    userId: number,
    since: Date,
    actions: string[],
  ): Promise<number> {
    return this.repository.count({
      where: {
        tenantId,
        userId,
        action: actions.length === 1 ? actions[0] : undefined,
        createdAt: Between(since, new Date()),
      },
    });
  }

  async aggregateTeamKpis(tenantId: string, since: Date) {
    const rows: Array<{
      user_id: string;
      action: string;
      count: string;
    }> = await this.repository.query(
      `
      SELECT user_id, action, COUNT(*)::text AS count
      FROM audit_logs
      WHERE tenant_id = $1 AND created_at >= $2
      GROUP BY user_id, action
      `,
      [tenantId, since],
    );

    const byUser = new Map<
      number,
      {
        reportsStatusUpdated: number;
        reportMessagesSent: number;
        contactReplies: number;
        contactClosed: number;
      }
    >();

    for (const row of rows) {
      const uid = Number(row.user_id);
      if (!byUser.has(uid)) {
        byUser.set(uid, {
          reportsStatusUpdated: 0,
          reportMessagesSent: 0,
          contactReplies: 0,
          contactClosed: 0,
        });
      }
      const stats = byUser.get(uid)!;
      const count = Number(row.count);
      switch (row.action) {
        case 'report.status_updated':
          stats.reportsStatusUpdated += count;
          break;
        case 'report.message_sent':
          stats.reportMessagesSent += count;
          break;
        case 'contact.reply_sent':
          stats.contactReplies += count;
          break;
        case 'contact.closed':
          stats.contactClosed += count;
          break;
      }
    }

    return byUser;
  }
}
