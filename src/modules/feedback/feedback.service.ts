import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CitizenFeedback, FeedbackResourceType } from './entities/citizen-feedback.entity';
import { CreateCitizenFeedbackDto } from './dto/create-citizen-feedback.dto';
import { Report } from '../reports/entities/report.entity';
import { ContactTicket } from '../contact-messages/entities/contact-ticket.entity';
import { User } from '../user/user.entity';
import { isTerminalContactStatus } from '../contact-messages/contact-ticket-status';

export interface UserRatingView {
  stars: number;
  message?: string;
  createdAt: string;
}

export interface FeedbackListItem {
  id: number;
  stars: number;
  message?: string;
  resourceType: FeedbackResourceType;
  resourceId: number;
  resourceLabel: string;
  citizenName: string;
  createdAt: string;
}

export interface SatisfactionSummary {
  satisfaction: number;
  satisfactionTrend: number;
  ratingsCount: number;
  trendData: { name: string; satisfaction: number }[];
}

const TERMINAL_REPORT_STATUSES = new Set(['Résolu', 'Clôturé']);
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(CitizenFeedback)
    private readonly feedbackRepo: Repository<CitizenFeedback>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(ContactTicket)
    private readonly ticketRepo: Repository<ContactTicket>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findUserRating(
    tenantId: string,
    userId: number,
    resourceType: FeedbackResourceType,
    resourceId: number,
  ): Promise<UserRatingView | undefined> {
    const row = await this.feedbackRepo.findOne({
      where: { tenantId, userId, resourceType, resourceId },
    });
    if (!row) return undefined;
    return {
      stars: row.stars,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async submit(
    tenantId: string,
    userId: number,
    dto: CreateCitizenFeedbackDto,
  ): Promise<UserRatingView> {
    await this.assertCanRate(tenantId, userId, dto.resourceType, dto.resourceId);

    const existing = await this.feedbackRepo.findOne({
      where: {
        tenantId,
        userId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
      },
    });
    if (existing) {
      throw new ConflictException('Vous avez déjà noté ce dossier');
    }

    const saved = await this.feedbackRepo.save(
      this.feedbackRepo.create({
        tenantId,
        userId,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        stars: dto.stars,
        message: dto.message?.trim() || undefined,
      }),
    );

    return {
      stars: saved.stars,
      message: saved.message,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async listForMayor(tenantId: string, limit = 100): Promise<FeedbackListItem[]> {
    const rows = await this.feedbackRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const userIds = [...new Set(rows.map((r) => r.userId))];
    const users =
      userIds.length > 0 ? await this.userRepo.find({ where: { id: In(userIds) } }) : [];
    const userNames = new Map(
      users.map((u) => [u.id, `${u.name || ''} ${u.surname || ''}`.trim() || u.email]),
    );

    const items: FeedbackListItem[] = [];
    for (const row of rows) {
      const resourceLabel = await this.resolveResourceLabel(
        tenantId,
        row.resourceType,
        row.resourceId,
      );
      items.push({
        id: row.id,
        stars: row.stars,
        message: row.message,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        resourceLabel,
        citizenName: userNames.get(row.userId) ?? 'Citoyen',
        createdAt: row.createdAt.toISOString(),
      });
    }
    return items;
  }

  async getSatisfactionSummary(tenantId: string): Promise<SatisfactionSummary> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allRows = await this.feedbackRepo.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });

    const recent = allRows.filter(
      (row) => this.toDate(row.createdAt).getTime() >= thirtyDaysAgo.getTime(),
    );

    if (allRows.length === 0) {
      return {
        satisfaction: 0,
        satisfactionTrend: 0,
        ratingsCount: 0,
        trendData: this.emptyTrendData(),
      };
    }

    const sourceForAverage = recent.length > 0 ? recent : allRows;
    const avgStars =
      sourceForAverage.reduce((sum, r) => sum + r.stars, 0) / sourceForAverage.length;
    const satisfaction = Math.round((avgStars / 5) * 100);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const lastWeek = recent.filter(
      (r) => this.toDate(r.createdAt).getTime() >= sevenDaysAgo.getTime(),
    );
    const prevWeek = recent.filter((r) => {
      const createdAt = this.toDate(r.createdAt).getTime();
      return createdAt >= fourteenDaysAgo.getTime() && createdAt < sevenDaysAgo.getTime();
    });

    let satisfactionTrend = 0;
    if (lastWeek.length > 0 && prevWeek.length > 0) {
      const lastAvg = lastWeek.reduce((s, r) => s + r.stars, 0) / lastWeek.length;
      const prevAvg = prevWeek.reduce((s, r) => s + r.stars, 0) / prevWeek.length;
      satisfactionTrend = Math.round(((lastAvg - prevAvg) / 5) * 100);
    }

    const trendData =
      recent.length > 0 ? this.buildWeeklyTrend(recent) : this.emptyTrendData();

    return {
      satisfaction,
      satisfactionTrend,
      ratingsCount: allRows.length,
      trendData,
    };
  }

  private emptyTrendData(): { name: string; satisfaction: number }[] {
    return DAY_LABELS.map((name) => ({ name, satisfaction: 0 }));
  }

  private toDate(value: Date | string): Date {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  }

  private buildWeeklyTrend(rows: CitizenFeedback[]): { name: string; satisfaction: number }[] {
    const buckets = new Map<string, number[]>();
    for (const row of rows) {
      const d = this.toDate(row.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(row.stars);
    }

    const result: { name: string; satisfaction: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const stars = buckets.get(key);
      const label = DAY_LABELS[d.getDay()];
      if (!stars || stars.length === 0) {
        result.push({ name: label, satisfaction: 0 });
      } else {
        const avg = stars.reduce((a, b) => a + b, 0) / stars.length;
        result.push({ name: label, satisfaction: Math.round((avg / 5) * 100) });
      }
    }
    return result;
  }

  private async assertCanRate(
    tenantId: string,
    userId: number,
    resourceType: FeedbackResourceType,
    resourceId: number,
  ): Promise<void> {
    if (resourceType === 'report') {
      const report = await this.reportRepo.findOne({
        where: { id: resourceId, tenantId },
      });
      if (!report) throw new NotFoundException('Signalement introuvable');
      if (report.userId != null && Number(report.userId) !== Number(userId)) {
        throw new ForbiddenException('Accès non autorisé');
      }
      if (!TERMINAL_REPORT_STATUSES.has(report.status)) {
        throw new BadRequestException(
          'La notation est disponible une fois le signalement résolu ou clôturé',
        );
      }
      return;
    }

    const ticket = await this.ticketRepo.findOne({
      where: { id: resourceId, tenantId },
    });
    if (!ticket) throw new NotFoundException('Conversation introuvable');
    if (Number(ticket.userId) !== Number(userId)) {
      throw new ForbiddenException('Accès non autorisé');
    }
    if (!isTerminalContactStatus(ticket.ticketType ?? 'question', ticket.status)) {
      throw new BadRequestException('La notation est disponible une fois la conversation terminée');
    }
  }

  private async resolveResourceLabel(
    tenantId: string,
    resourceType: FeedbackResourceType,
    resourceId: number,
  ): Promise<string> {
    if (resourceType === 'report') {
      const report = await this.reportRepo.findOne({
        where: { id: resourceId, tenantId },
        select: ['category', 'description'],
      });
      if (!report) return `Signalement #${resourceId}`;
      return report.description?.trim() || report.category;
    }
    const ticket = await this.ticketRepo.findOne({
      where: { id: resourceId, tenantId },
      select: ['subject', 'ticketType'],
    });
    if (!ticket) return `Conversation #${resourceId}`;
    const prefix = ticket.ticketType === 'suggestion' ? 'Suggestion' : 'Question';
    return `${prefix} · ${ticket.subject}`;
  }
}
