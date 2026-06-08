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
  ) {}

  async create(tenantId: string, data: CreateReportDto): Promise<Report> {
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

  async findDetail(tenantId: string, id: number): Promise<ReportDetailView> {
    const report = await this.reportRepository.findOne({
      where: { id, tenantId },
    });
    if (!report) {
      throw new NotFoundException('Signalement introuvable');
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
    };
  }

  async addMessage(
    tenantId: string,
    reportId: number,
    senderId: number,
    senderRole: ReportMessageRole,
    body: string,
  ): Promise<ReportDetailView> {
    const report = await this.reportRepository.findOneBy({ id: reportId, tenantId });
    if (!report) {
      throw new NotFoundException('Signalement introuvable');
    }
    if (report.status === 'Résolu' || report.status === 'Clôturé') {
      throw new BadRequestException('Ce signalement est clôturé.');
    }

    if (senderRole === 'citizen' && report.userId !== senderId) {
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

    return this.findDetail(tenantId, reportId);
  }

  async updateStatus(id: number, status: string, tenantId?: string): Promise<Report> {
    const where = tenantId ? { id, tenantId } : { id };
    const report = await this.reportRepository.findOneBy(where);
    if (!report) {
      throw new BadRequestException('Signalement introuvable');
    }
    report.status = status;
    return this.reportRepository.save(report);
  }

  isInsideBoundary(_longitude: number, _latitude: number, _cityBoundary: any): boolean {
    return true;
  }

  async getClusteredReports(_bounds: any) {
    return await Promise.resolve([]);
  }
}
