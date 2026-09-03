import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { ParsedQs } from 'qs';
import { Report } from './entities/report.entity';
import { ReportMessage, ReportMessageRole } from './entities/report-message.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';
import { resolveReportSenderRole } from '../../core/auth/roles';
import { AuditService } from '../audit/audit.service';
import { FeedbackService, UserRatingView } from '../feedback/feedback.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { AI_ENRICHMENT_QUEUE } from '../ai-engine/ai-enrichment.processor';

export interface ReportMessageView {
  id: number;
  senderId: number;
  senderRole: ReportMessageRole;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface ReportCitizenView {
  id: number;
  name: string;
  surname: string;
  email: string;
  cityId?: string;
  cityName?: string;
}

export interface ReportListItem {
  id: number;
  category: string;
  status: string;
  description?: string;
  imageUrl?: string;
  lat: number;
  lon: number;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    body: string;
    senderRole: ReportMessageRole;
    createdAt: string;
  };
}

export interface ReportDetailView {
  id: number;
  tenantId: string;
  userId?: number;
  category: string;
  status: string;
  imageUrl?: string;
  description?: string;
  isResident: boolean;
  lat: number;
  lon: number;
  createdAt: string;
  updatedAt: string;
  citizen?: ReportCitizenView;
  messages: ReportMessageView[];
  userRating?: UserRatingView;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(ReportMessage)
    private readonly messageRepository: Repository<ReportMessage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly feedbackService: FeedbackService,
    private readonly aiEngineService: AiEngineService,
    @InjectQueue(AI_ENRICHMENT_QUEUE) private readonly aiQueue: Queue,
  ) {}

  async create(tenantId: string, data: CreateReportDto, actorUserId?: number): Promise<Report> {
    const lat = Number(data.lat);
    const lon = Number(data.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException('Latitude et longitude sont requises.');
    }

    let isResident = true;
    if (data.userId) {
      const user = await this.reportRepository.manager.findOne(User, {
        where: { id: data.userId },
        select: ['cityId'],
      });

      if (user?.cityId) {
        isResident = user.cityId === tenantId;
      } else {
        isResident = false;
      }
    }

    const insertResult = await this.reportRepository
      .createQueryBuilder()
      .insert()
      .into(Report)
      .values({
        tenantId,
        category: data.category,
        description: data.description,
        imageUrl: data.imageUrl,
        userId: data.userId,
        status: data.status ?? 'En attente',
        isResident,
        lat,
        lon,
      })
      .returning('id')
      .execute();

    const insertedRow = insertResult.identifiers[0] as { id: number | string } | undefined;
    const id = insertedRow?.id != null ? Number(insertedRow.id) : NaN;
    if (!Number.isFinite(id)) {
      throw new BadRequestException('Échec de la création du signalement.');
    }

    const savedReport = await this.reportRepository.findOneByOrFail({ id });

    // ─── Enrichissement IA (asynchrone via BullMQ) ───
    try {
      await this.aiQueue.add('enrich', {
        report_id: savedReport.id,
        tenant_id: tenantId,
        user_id: data.userId,
        content: data.description ?? '',
        lat,
        lon,
      });
      this.logger.log(`AI enrichment queued for report ${savedReport.id}`);
    } catch (queueErr) {
      this.logger.error(
        `AI queue dispatch failed for report ${savedReport.id}: ${(queueErr as Error).message}`,
      );
    }

    if (actorUserId) {
      await this.auditService.log({
        tenantId,
        userId: actorUserId,
        action: 'report.created',
        resourceType: 'report',
        resourceId: savedReport.id,
        metadata: { category: savedReport.category },
      });
    }

    if (data.userId) {
      try {
        await this.reportRepository.manager.increment('User', { id: data.userId }, 'points', 10);
      } catch (error) {
        this.logger.error('Failed to award points to user:', error);
      }
    }

    return savedReport;
  }

  async findAll(tenantId: string): Promise<Report[]> {
    // SQL brut : ignore les colonnes IA éventuellement absentes (sentiment_score, …)
    // que TypeORM inclurait sinon via le mapping d'entité.
    try {
      const rows: Array<{
        id: number;
        tenant_id: string;
        user_id: number | null;
        category: string;
        status: string;
        is_resident: boolean;
        image_url: string | null;
        description: string | null;
        lat: number | null;
        lon: number | null;
        created_at: Date;
        updated_at: Date;
      }> = await this.reportRepository.query(
        `SELECT id, tenant_id, user_id, category, status, is_resident,
                image_url, description, lat, lon, created_at, updated_at
         FROM reports
         WHERE tenant_id = $1
         ORDER BY created_at DESC`,
        [tenantId],
      );

      return rows.map((row) => {
        const report = new Report();
        report.id = row.id;
        report.tenantId = row.tenant_id;
        report.userId = row.user_id ?? undefined;
        report.category = row.category;
        report.status = row.status;
        report.isResident = row.is_resident;
        report.imageUrl = row.image_url ?? undefined;
        report.description = row.description ?? undefined;
        report.lat = row.lat ?? undefined;
        report.lon = row.lon ?? undefined;
        report.createdAt = new Date(row.created_at);
        report.updatedAt = new Date(row.updated_at);
        return report;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`findAll reports failed for ${tenantId}: ${message}`);
      throw error;
    }
  }

  private async toListItem(report: Report): Promise<ReportListItem> {
    const lat = report.lat ?? 0;
    const lon = report.lon ?? 0;
    const last = await this.messageRepository.findOne({
      where: { reportId: report.id },
      order: { createdAt: 'DESC' },
    });
    return {
      id: report.id,
      category: report.category,
      status: report.status,
      description: report.description,
      imageUrl: report.imageUrl,
      lat,
      lon,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      lastMessage: last
        ? {
            body: last.body,
            senderRole: last.senderRole,
            createdAt: last.createdAt.toISOString(),
          }
        : undefined,
    };
  }

  async findByUser(tenantId: string, userId: number): Promise<ReportListItem[]> {
    const reports = await this.findAllForUser(tenantId, userId);
    return Promise.all(reports.map((report) => this.toListItem(report)));
  }

  /** Liste citoyenne sans colonnes IA (même stratégie que findAll). */
  private async findAllForUser(tenantId: string, userId: number): Promise<Report[]> {
    try {
      const rows: Array<{
        id: number;
        tenant_id: string;
        user_id: number | null;
        category: string;
        status: string;
        is_resident: boolean;
        image_url: string | null;
        description: string | null;
        lat: number | null;
        lon: number | null;
        created_at: Date;
        updated_at: Date;
      }> = await this.reportRepository.query(
        `SELECT id, tenant_id, user_id, category, status, is_resident,
                image_url, description, lat, lon, created_at, updated_at
         FROM reports
         WHERE tenant_id = $1 AND user_id = $2
         ORDER BY updated_at DESC
         LIMIT 50`,
        [tenantId, userId],
      );

      return rows.map((row) => {
        const report = new Report();
        report.id = row.id;
        report.tenantId = row.tenant_id;
        report.userId = row.user_id ?? undefined;
        report.category = row.category;
        report.status = row.status;
        report.isResident = row.is_resident;
        report.imageUrl = row.image_url ?? undefined;
        report.description = row.description ?? undefined;
        report.lat = row.lat ?? undefined;
        report.lon = row.lon ?? undefined;
        report.createdAt = new Date(row.created_at);
        report.updatedAt = new Date(row.updated_at);
        return report;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`findByUser reports failed for ${tenantId}/${userId}: ${message}`);
      throw error;
    }
  }

  private async resolveSenderDisplayName(userId: number, role: ReportMessageRole): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['name', 'surname', 'email'],
    });
    if (!user) return role === 'agent' ? 'Mairie' : 'Utilisateur';
    const full = `${user.name || ''} ${user.surname || ''}`.trim();
    const person = full || user.email;
    if (role === 'agent') return `Mairie — ${person}`;
    return person;
  }

  private async mapMessages(messages: ReportMessage[]): Promise<ReportMessageView[]> {
    const names = new Map<string, string>();
    const result: ReportMessageView[] = [];
    for (const msg of messages) {
      const cacheKey = `${msg.senderId}:${msg.senderRole}`;
      if (!names.has(cacheKey)) {
        names.set(cacheKey, await this.resolveSenderDisplayName(msg.senderId, msg.senderRole));
      }
      result.push({
        id: msg.id,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        senderName: names.get(cacheKey)!,
        body: msg.body,
        createdAt: msg.createdAt.toISOString(),
      });
    }
    return result;
  }

  async findDetail(
    tenantId: string,
    id: number,
    userId: number,
    role: string,
  ): Promise<ReportDetailView> {
    const report = await this.reportRepository.findOne({
      where: { id, tenantId },
      select: [
        'id',
        'tenantId',
        'userId',
        'category',
        'status',
        'isResident',
        'imageUrl',
        'description',
        'lat',
        'lon',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!report) {
      throw new NotFoundException('Signalement introuvable');
    }

    const isAgent = resolveReportSenderRole(role) === 'agent';
    if (!isAgent && report.userId != null && Number(report.userId) !== Number(userId)) {
      throw new ForbiddenException('Accès non autorisé à ce signalement');
    }

    const lat = report.lat ?? 0;
    const lon = report.lon ?? 0;
    const rawMessages = await this.messageRepository.find({
      where: { reportId: id },
      order: { createdAt: 'ASC' },
    });
    const messages = await this.mapMessages(rawMessages);

    let citizen: ReportCitizenView | undefined;
    if (report.userId) {
      const user = await this.userRepository.findOne({ where: { id: report.userId } });
      if (user) {
        let cityName: string | undefined;
        if (user.cityId) {
          const city = await this.cityRepository.findOne({
            where: { id: user.cityId },
            select: ['name'],
          });
          cityName = city?.name;
        }
        citizen = {
          id: user.id,
          name: user.name,
          surname: user.surname,
          email: user.email,
          cityId: user.cityId,
          cityName,
        };
      }
    }

    let userRating: UserRatingView | undefined;
    if (!isAgent && report.userId != null) {
      userRating = await this.feedbackService.findUserRating(tenantId, userId, 'report', report.id);
    }

    return {
      id: report.id,
      tenantId: report.tenantId,
      userId: report.userId,
      category: report.category,
      status: report.status,
      imageUrl: report.imageUrl,
      description: report.description,
      isResident: report.isResident,
      lat,
      lon,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      citizen,
      messages,
      userRating,
    };
  }

  async addMessage(
    tenantId: string,
    reportId: number,
    senderId: number,
    body: string,
    roleHint?: string,
  ): Promise<ReportDetailView> {
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
      select: ['id', 'role', 'cityId'],
    });
    if (!sender) {
      throw new ForbiddenException('Utilisateur introuvable.');
    }

    const senderRole = resolveReportSenderRole(roleHint ?? sender.role);

    if (senderRole === 'agent' && sender.cityId && sender.cityId !== tenantId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé pour cette ville.");
    }

    const report = await this.reportRepository.findOneBy({ id: reportId, tenantId });
    if (!report) {
      throw new NotFoundException('Signalement introuvable');
    }
    if (report.status === 'Résolu' || report.status === 'Clôturé') {
      throw new BadRequestException('Ce signalement est clôturé.');
    }

    if (
      senderRole === 'citizen' &&
      report.userId != null &&
      Number(report.userId) !== Number(senderId)
    ) {
      throw new ForbiddenException('Accès non autorisé à ce signalement');
    }

    const trimmed = body.trim();
    if (!trimmed) {
      throw new BadRequestException('Le message ne peut pas être vide');
    }

    await this.messageRepository.save(
      this.messageRepository.create({
        reportId,
        senderId,
        senderRole,
        body: trimmed,
      }),
    );

    if (report.status === 'En attente' && senderRole === 'agent') {
      report.status = 'En cours';
      await this.reportRepository.save(report);
    }

    await this.auditService.log({
      tenantId,
      userId: senderId,
      action: 'report.message_sent',
      resourceType: 'report',
      resourceId: reportId,
      metadata: { senderRole },
    });

    if (senderRole === 'agent' && report.userId) {
      const preview = trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed;
      void this.notificationsService
        .sendPushNotification(String(report.userId), 'Réponse sur votre signalement', preview, {
          type: 'report',
          reportId,
        })
        .catch(() => undefined);
    }

    return this.findDetail(tenantId, reportId, senderId, sender.role);
  }

  async updateStatus(
    id: number,
    status: string,
    tenantId: string | undefined,
    actorUserId: number,
  ): Promise<Report> {
    const where = tenantId ? { id, tenantId } : { id };
    const report = await this.reportRepository.findOneBy(where);
    if (!report) {
      throw new BadRequestException('Signalement introuvable');
    }
    const previous = report.status;
    report.status = status;
    const saved = await this.reportRepository.save(report);

    if (tenantId) {
      await this.auditService.log({
        tenantId,
        userId: actorUserId,
        action: 'report.status_updated',
        resourceType: 'report',
        resourceId: id,
        metadata: { status, previous },
      });
    }

    return saved;
  }

  async getClusteredReports(_bounds: ParsedQs) {
    return await Promise.resolve([]);
  }
}
