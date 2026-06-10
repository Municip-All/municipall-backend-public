import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { ReportMessage, ReportMessageRole } from './entities/report-message.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';
import { resolveReportSenderRole } from '../../core/auth/roles';
import { AuditService } from '../audit/audit.service';
import { FeedbackService, UserRatingView } from '../feedback/feedback.service';
import { NotificationsService } from '../notifications/notifications.service';

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

interface CoordinateRow {
  lat: string | number;
  lon: string | number;
}

function isCoordinateRow(value: unknown): value is CoordinateRow {
  if (typeof value !== 'object' || value === null) return false;
  return 'lat' in value && 'lon' in value;
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
        location: () => `ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)`,
      })
      .returning('id')
      .execute();

    const insertedRow = insertResult.identifiers[0] as { id: number | string } | undefined;
    const id = insertedRow?.id != null ? Number(insertedRow.id) : NaN;
    if (!Number.isFinite(id)) {
      throw new BadRequestException('Échec de la création du signalement.');
    }

    const savedReport = await this.reportRepository.findOneByOrFail({ id });

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
        console.error('Failed to award points to user:', error);
      }
    }

    return savedReport;
  }

  async findAll(tenantId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  private async toListItem(report: Report): Promise<ReportListItem> {
    const { lat, lon } = await this.extractCoordinates(report.id);
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
    const reports = await this.reportRepository.find({
      where: { tenantId, userId },
      order: { updatedAt: 'DESC' },
      take: 50,
    });
    return Promise.all(reports.map((report) => this.toListItem(report)));
  }

  private async extractCoordinates(reportId: number): Promise<{ lat: number; lon: number }> {
    const raw: unknown = await this.reportRepository.query(
      `SELECT ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lon FROM reports WHERE id = $1`,
      [reportId],
    );
    const row = Array.isArray(raw) && isCoordinateRow(raw[0]) ? raw[0] : undefined;
    return {
      lat: row ? Number(row.lat) : 0,
      lon: row ? Number(row.lon) : 0,
    };
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
    });
    if (!report) {
      throw new NotFoundException('Signalement introuvable');
    }

    const isAgent = resolveReportSenderRole(role) === 'agent';
    if (!isAgent && report.userId != null && Number(report.userId) !== Number(userId)) {
      throw new ForbiddenException('Accès non autorisé à ce signalement');
    }

    const { lat, lon } = await this.extractCoordinates(id);
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

  isInsideBoundary(_longitude: number, _latitude: number, _cityBoundary: any): boolean {
    return true;
  }

  async getClusteredReports(_bounds: any) {
    return await Promise.resolve([]);
  }
}
