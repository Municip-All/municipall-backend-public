import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { User } from '../user/user.entity';
import { ContactTicket } from '../contact-messages/entities/contact-ticket.entity';
import { ContactTicketMessage } from '../contact-messages/entities/contact-ticket-message.entity';
import { City } from './entities/city.entity';
import { AuditService } from '../audit/audit.service';

const URGENT_REPORT_CATEGORIES = ['Voirie', 'Éclairage', 'Sécurité'];
const URGENT_KEYWORDS = /urgent|très grave|tres grave|grave|danger|accident/i;

export interface CityContactConfig {
  email?: string;
  phone?: string;
  helpText?: string;
}

export interface CityConfig {
  name: string;
  features: string[];
  /** Texte contractuel affiché dans la politique de confidentialité (durées par commune) */
  dataRetentionPolicy?: string;
  contact?: CityContactConfig;
  theme: {
    primaryColor: string;
    secondaryColor?: string;
    useGradient: boolean;
    logoUrl?: string;
  };
  neighborhoods?: { id: string; name: string; points: [number, number][] }[];
  usefulNumbers?: { label: string; phone: string; icon: string }[];
  usefulLinks?: { label: string; url: string; icon: string }[];
  wasteConfig?: {
    services: {
      type: string;
      icon: string;
      color: string;
      days: number[];
      time: string;
    }[];
  };
}

export type DashboardAlertSeverity = 'urgent' | 'high' | 'normal';
export type DashboardAlertType = 'report' | 'contact';

export interface DashboardAlert {
  id: string;
  type: DashboardAlertType;
  severity: DashboardAlertSeverity;
  title: string;
  subtitle: string;
  createdAt: string;
  entityId: number;
}

export interface CityDashboardStats {
  satisfaction: number;
  satisfactionTrend: number;
  citizensCount: number;
  activeReportsCount: number;
  pendingContactMessagesCount: number;
  urgentReportsCount: number;
  reportsInProgressCount: number;
  pendingTotalCount: number;
  urgentAlertsCount: number;
  reportsTrend: number;
  suggestionsCount: number;
  suggestionsTrend: number;
  trendData: { name: string; satisfaction: number }[];
  alerts: DashboardAlert[];
}

@Injectable()
export class CityConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ContactTicket)
    private readonly contactTicketRepository: Repository<ContactTicket>,
    @InjectRepository(ContactTicketMessage)
    private readonly contactTicketMessageRepository: Repository<ContactTicketMessage>,
    private readonly auditService: AuditService,
  ) {}

  private isUrgentTicket(ticket: ContactTicket, lastBody?: string): boolean {
    const text = `${ticket.subject} ${lastBody ?? ''}`;
    return URGENT_KEYWORDS.test(text);
  }

  private buildAlerts(
    pendingReports: Report[],
    pendingTickets: ContactTicket[],
    lastBodies: Map<number, string>,
  ): DashboardAlert[] {
    const reportAlerts: DashboardAlert[] = pendingReports.map((report) => {
      const urgent = URGENT_REPORT_CATEGORIES.includes(report.category);
      return {
        id: `report-${report.id}`,
        type: 'report',
        severity: urgent ? 'urgent' : 'high',
        title: `Signalement #${String(report.id).padStart(4, '0')} — ${report.category}`,
        subtitle: report.description?.slice(0, 120) || 'Aucune description',
        createdAt: report.createdAt.toISOString(),
        entityId: report.id,
      };
    });

    const messageAlerts: DashboardAlert[] = pendingTickets.map((ticket) => {
      const lastBody = lastBodies.get(ticket.id) ?? '';
      return {
        id: `contact-${ticket.id}`,
        type: 'contact',
        severity: this.isUrgentTicket(ticket, lastBody) ? 'urgent' : 'normal',
        title: `Conversation — ${ticket.subject}`,
        subtitle: lastBody.slice(0, 120) || 'Nouvelle conversation',
        createdAt: ticket.updatedAt.toISOString(),
        entityId: ticket.id,
      };
    });

    return [...reportAlerts, ...messageAlerts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async onModuleInit() {
    try {
      // Seed default city if not exists (for dev purposes)
      const count = await this.cityRepository.count();
      if (count === 0) {
        await this.cityRepository.save({
          id: 'city-1',
          name: 'Antigravity City',
          primaryColor: '#244FE5',
          secondaryColor: '#3B82F6',
          useGradient: true,
          logoUrl: 'https://example.com/logo.png',
          features: ['flux-live', 'agenda', 'reports', 'weather'],
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(
        'CityConfigService: Could not seed default city. The "cities" table might not exist yet.',
        errorMessage,
      );
    }
  }

  async findAllActive(): Promise<Partial<City>[]> {
    return this.cityRepository.find({
      select: ['id', 'name', 'logoUrl'],
    });
  }

  async getCityConfig(cityId: string): Promise<CityConfig> {
    const city = await this.cityRepository.findOneBy({ id: cityId });
    if (!city) {
      return {
        name: "Municip'All",
        features: [],
        theme: { primaryColor: '#244FE5', useGradient: false, logoUrl: '' },
      };
    }
    return {
      name: city.name,
      features: city.features,
      dataRetentionPolicy: city.dataRetentionPolicy || undefined,
      contact: {
        email: city.contactEmail || undefined,
        phone: city.contactPhone || undefined,
        helpText: city.contactHelpText || undefined,
      },
      theme: {
        primaryColor: city.primaryColor,
        secondaryColor: city.secondaryColor,
        useGradient: city.useGradient,
        logoUrl: city.logoUrl,
      },
      neighborhoods: city.neighborhoods || [],
      usefulNumbers: city.usefulNumbers || [],
      usefulLinks: city.usefulLinks || [],
      wasteConfig: city.wasteConfig || { services: [] },
    };
  }

  async isFeatureEnabled(cityId: string, featureName: string): Promise<boolean> {
    const cityConfig = await this.getCityConfig(cityId);
    return cityConfig.features.includes(featureName);
  }

  async findByLocation(lat: number, lon: number): Promise<City | null> {
    const query = this.cityRepository
      .createQueryBuilder('city')
      .where('ST_Contains(city.boundary, ST_SetSRID(ST_Point(:lon, :lat), 4326))', {
        lon,
        lat,
      })
      .getOne();

    return query;
  }

  async getDashboardStats(cityId: string): Promise<CityDashboardStats> {
    const citizensCount = await this.userRepository.count({
      where: { cityId, role: 'citizen' },
    });

    const pendingReports = await this.reportRepository.find({
      where: { tenantId: cityId, status: 'En attente' },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    const pendingTickets = await this.contactTicketRepository
      .createQueryBuilder('ticket')
      .where('ticket.tenant_id = :cityId', { cityId })
      .andWhere('ticket.status IN (:...statuses)', { statuses: ['En attente', 'En cours'] })
      .orderBy('ticket.updated_at', 'DESC')
      .take(30)
      .getMany();

    const lastBodies = new Map<number, string>();
    for (const ticket of pendingTickets) {
      const last = await this.contactTicketMessageRepository.findOne({
        where: { ticketId: ticket.id },
        order: { createdAt: 'DESC' },
      });
      if (last) lastBodies.set(ticket.id, last.body);
    }

    const reportsInProgressCount = await this.reportRepository.count({
      where: { tenantId: cityId, status: 'En cours' },
    });

    const pendingContactMessagesCount = pendingTickets.length;
    const activeReportsCount = pendingReports.length;
    const urgentReportsCount = pendingReports.filter((r) =>
      URGENT_REPORT_CATEGORIES.includes(r.category),
    ).length;

    const alerts = this.buildAlerts(pendingReports, pendingTickets, lastBodies);
    const urgentAlertsCount = alerts.filter((a) => a.severity === 'urgent').length;

    return {
      satisfaction: 78,
      satisfactionTrend: 5,
      citizensCount,
      activeReportsCount,
      pendingContactMessagesCount,
      urgentReportsCount,
      reportsInProgressCount,
      pendingTotalCount: activeReportsCount + pendingContactMessagesCount,
      urgentAlertsCount,
      reportsTrend: -12,
      suggestionsCount: pendingTickets.length,
      suggestionsTrend: 0,
      trendData: [
        { name: 'Lun', satisfaction: 65 },
        { name: 'Mar', satisfaction: 68 },
        { name: 'Mer', satisfaction: 62 },
        { name: 'Jeu', satisfaction: 74 },
        { name: 'Ven', satisfaction: 79 },
        { name: 'Sam', satisfaction: 77 },
        { name: 'Dim', satisfaction: 84 },
      ],
      alerts,
    };
  }

  async updateCityConfig(
    cityId: string,
    data: Record<string, unknown>,
    actorUserId?: number,
  ): Promise<City> {
    const city = await this.cityRepository.findOneBy({ id: cityId });
    if (!city) {
      throw new NotFoundException('Ville introuvable');
    }

    const patch: Partial<City> = {};
    if (typeof data.name === 'string') patch.name = data.name;
    if (Array.isArray(data.features)) patch.features = data.features as string[];
    if (typeof data.dataRetentionPolicy === 'string') {
      patch.dataRetentionPolicy = data.dataRetentionPolicy;
    }
    if (typeof data.contactEmail === 'string') patch.contactEmail = data.contactEmail;
    if (typeof data.contactPhone === 'string') patch.contactPhone = data.contactPhone;
    if (typeof data.contactHelpText === 'string') patch.contactHelpText = data.contactHelpText;
    if (typeof data.primaryColor === 'string') patch.primaryColor = data.primaryColor;
    if (typeof data.secondaryColor === 'string') patch.secondaryColor = data.secondaryColor;
    if (typeof data.useGradient === 'boolean') patch.useGradient = data.useGradient;
    if (typeof data.logoUrl === 'string') patch.logoUrl = data.logoUrl;
    if (Array.isArray(data.neighborhoods)) {
      patch.neighborhoods = data.neighborhoods as City['neighborhoods'];
    }
    if (data.wasteConfig && typeof data.wasteConfig === 'object') {
      patch.wasteConfig = data.wasteConfig as City['wasteConfig'];
    }

    await this.cityRepository.update(cityId, patch);

    if (actorUserId) {
      await this.auditService.log({
        tenantId: cityId,
        userId: actorUserId,
        action: 'city.config_updated',
        resourceType: 'city',
        metadata: { fields: Object.keys(patch) },
      });
    }

    return this.cityRepository.findOneByOrFail({ id: cityId });
  }
}
