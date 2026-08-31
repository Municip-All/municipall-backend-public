import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { User } from '../user/user.entity';
import { City } from './entities/city.entity';
import { AuditService } from '../audit/audit.service';
import { FeedbackService } from '../feedback/feedback.service';
import { ContactTicketsService } from '../contact-messages/contact-tickets.service';
import { ContactTicket } from '../contact-messages/entities/contact-ticket.entity';

const URGENT_REPORT_CATEGORIES = ['Voirie', 'Éclairage', 'Sécurité'];

export interface CityContactConfig {
  email?: string;
  phone?: string;
  helpText?: string;
}

export interface CityConfig {
  name: string;
  /** Nom officiel pour cartes / géolocalisation (≠ nom d'app marque blanche) */
  officialName?: string;
  features: string[];
  /** Texte contractuel affiché dans la politique de confidentialité (durées par commune) */
  dataRetentionPolicy?: string;
  contact?: CityContactConfig;
  theme: {
    primaryColor: string;
    secondaryColor?: string;
    backgroundColorLight?: string;
    backgroundColorDark?: string;
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
  /** Contrat plateforme (lecture backoffice / webadmin) */
  isTransportFeatureAllowed?: boolean;
  /** Activé pour les citoyens (effectif = allowed && enabled) */
  isTransportFeatureEnabled?: boolean;
  associations?: {
    id: string;
    name: string;
    category: 'association' | 'groupe-parole' | 'autre';
    description?: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
  }[];
  publicProfile?: {
    mayorName?: string;
    mayorTitle?: string;
    welcomeText?: string;
    description?: string;
    address?: string;
    website?: string;
    openingHours?: string;
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
  contactKind?: 'question' | 'suggestion';
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
  ratingsCount: number;
  alerts: DashboardAlert[];
}

const KNOWN_CITY_OFFICIAL_NAMES: Record<string, string> = {
  'le-kremlin-bicetre': 'Le Kremlin-Bicêtre',
};

function resolveOfficialName(city: City): string {
  if (city.officialName?.trim()) return city.officialName.trim();
  if (KNOWN_CITY_OFFICIAL_NAMES[city.id]) return KNOWN_CITY_OFFICIAL_NAMES[city.id];
  return city.id
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

@Injectable()
export class CityConfigService implements OnModuleInit {
  private readonly logger = new Logger(CityConfigService.name);

  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly contactTicketsService: ContactTicketsService,
    private readonly auditService: AuditService,
    private readonly feedbackService: FeedbackService,
  ) {}

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
      const isSuggestion = ticket.ticketType === 'suggestion';
      return {
        id: `contact-${ticket.id}`,
        type: 'contact',
        severity: this.contactTicketsService.isUrgentTicket(ticket, lastBody) ? 'urgent' : 'normal',
        title: isSuggestion ? `Suggestion — ${ticket.subject}` : `Question — ${ticket.subject}`,
        subtitle:
          lastBody.slice(0, 120) || (isSuggestion ? 'Nouvelle suggestion' : 'Nouvelle question'),
        createdAt: ticket.updatedAt.toISOString(),
        entityId: ticket.id,
        contactKind: isSuggestion ? 'suggestion' : 'question',
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
          primaryColor: '#0B0080',
          secondaryColor: '#3B82F6',
          useGradient: true,
          logoUrl: 'https://example.com/logo.png',
          features: ['flux-live', 'agenda', 'reports', 'weather'],
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        'CityConfigService: Could not seed default city. The "cities" table might not exist yet.',
        errorMessage,
      );
    }
  }

  async findAllActive(): Promise<
    { id: string; name: string; officialName: string; logoUrl?: string }[]
  > {
    const cities = await this.cityRepository.find({
      select: ['id', 'name', 'logoUrl', 'officialName'],
    });
    return cities.map((city) => ({
      id: city.id,
      name: city.name,
      officialName: resolveOfficialName(city),
      logoUrl: city.logoUrl,
    }));
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
      officialName: resolveOfficialName(city),
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
        backgroundColorLight: city.backgroundColorLight || undefined,
        backgroundColorDark: city.backgroundColorDark || undefined,
        useGradient: city.useGradient,
        logoUrl: city.logoUrl,
      },
      neighborhoods: city.neighborhoods || [],
      usefulNumbers: city.usefulNumbers || [],
      usefulLinks: city.usefulLinks || [],
      wasteConfig: city.wasteConfig || { services: [] },
      isTransportFeatureAllowed: !!city.isTransportFeatureAllowed,
      isTransportFeatureEnabled: !!city.isTransportFeatureEnabled,
      associations: city.associations ?? [],
      publicProfile: city.publicProfile ?? undefined,
    };
  }

  async getCityEntity(cityId: string): Promise<City> {
    const city = await this.cityRepository.findOneBy({ id: cityId });
    if (!city) {
      throw new NotFoundException('Ville introuvable');
    }
    return city;
  }

  async assertTransportAccess(cityId: string): Promise<City> {
    const city = await this.getCityEntity(cityId);
    if (!city.isTransportFeatureAllowed || !city.isTransportFeatureEnabled) {
      throw new ForbiddenException(
        'Le module transports en commun est désactivé pour cette commune',
      );
    }
    return city;
  }

  async isFeatureEnabled(cityId: string, featureName: string): Promise<boolean> {
    const cityConfig = await this.getCityConfig(cityId);
    return cityConfig.features.includes(featureName);
  }

  async getCityBoundaryGeoJson(
    cityId: string,
  ): Promise<{ type: 'Feature'; geometry: unknown; properties: { name: string } } | null> {
    const rows: Array<{ geojson: string; official_name: string | null; name: string }> =
      await this.cityRepository.query(
        `SELECT ST_AsGeoJSON(boundary) AS geojson, official_name, name FROM cities WHERE id = $1`,
        [cityId],
      );
    const row = rows[0];
    if (!row?.geojson) return null;

    let geometry: unknown;
    try {
      geometry = JSON.parse(row.geojson);
    } catch {
      return null;
    }

    const city = await this.cityRepository.findOneBy({ id: cityId });
    const label = city ? resolveOfficialName(city) : row.name;

    return {
      type: 'Feature',
      geometry,
      properties: { name: label },
    };
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

    const allTickets = await this.contactTicketsService.findPendingForTenant(cityId);

    const pendingTickets = allTickets;

    const lastBodies = new Map<number, string>();
    for (const ticket of pendingTickets) {
      const last = await this.contactTicketsService.findLastMessage(ticket.id);
      if (last) lastBodies.set(ticket.id, last.body);
    }

    const reportsInProgressCount = await this.reportRepository.count({
      where: { tenantId: cityId, status: 'En cours' },
    });

    const pendingContactMessagesCount = pendingTickets.length;
    const pendingSuggestionsCount = pendingTickets.filter(
      (t) => t.ticketType === 'suggestion',
    ).length;
    const activeReportsCount = pendingReports.length;
    const urgentReportsCount = pendingReports.filter((r) =>
      URGENT_REPORT_CATEGORIES.includes(r.category),
    ).length;

    const alerts = this.buildAlerts(pendingReports, pendingTickets, lastBodies);
    const urgentAlertsCount = alerts.filter((a) => a.severity === 'urgent').length;

    const satisfactionSummary = await this.feedbackService.getSatisfactionSummary(cityId);

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthReports = await this.reportRepository.count({
      where: { tenantId: cityId, createdAt: LessThanOrEqual(now) },
    });

    const previousMonthReports = await this.reportRepository.count({
      where: { tenantId: cityId, createdAt: LessThanOrEqual(previousMonthStart) },
    });

    let reportsTrend = 0;
    if (previousMonthReports > 0) {
      reportsTrend = Math.round(
        ((currentMonthReports - previousMonthReports) / previousMonthReports) * 100,
      );
    }

    const currentMonthSuggestions = await this.contactTicketsService.findPendingForTenant(cityId);
    const currentSuggCount = currentMonthSuggestions.filter(
      (t) => t.ticketType === 'suggestion' && t.createdAt >= currentMonthStart,
    ).length;
    const previousSuggCount = currentMonthSuggestions.filter(
      (t) =>
        t.ticketType === 'suggestion' &&
        t.createdAt >= previousMonthStart &&
        t.createdAt < currentMonthStart,
    ).length;

    let suggestionsTrend = 0;
    if (previousSuggCount > 0) {
      suggestionsTrend = Math.round(
        ((currentSuggCount - previousSuggCount) / previousSuggCount) * 100,
      );
    }

    return {
      satisfaction: satisfactionSummary.satisfaction,
      satisfactionTrend: satisfactionSummary.satisfactionTrend,
      citizensCount,
      activeReportsCount,
      pendingContactMessagesCount,
      urgentReportsCount,
      reportsInProgressCount,
      pendingTotalCount: activeReportsCount + pendingContactMessagesCount,
      urgentAlertsCount,
      reportsTrend,
      suggestionsCount: pendingSuggestionsCount,
      suggestionsTrend,
      trendData: satisfactionSummary.trendData,
      ratingsCount: satisfactionSummary.ratingsCount,
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

    const patch: Record<string, unknown> = {};
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
    if (typeof data.backgroundColorLight === 'string') {
      patch.backgroundColorLight = data.backgroundColorLight;
    }
    if (typeof data.backgroundColorDark === 'string') {
      patch.backgroundColorDark = data.backgroundColorDark;
    }
    if (Array.isArray(data.neighborhoods)) {
      patch.neighborhoods = data.neighborhoods as City['neighborhoods'];
    }
    if (data.wasteConfig && typeof data.wasteConfig === 'object') {
      patch.wasteConfig = data.wasteConfig as City['wasteConfig'];
    }
    if (typeof data.isTransportFeatureEnabled === 'boolean') {
      if (data.isTransportFeatureEnabled && !city.isTransportFeatureAllowed) {
        throw new ForbiddenException(
          "Le module transports n'est pas inclus dans le contrat de cette commune",
        );
      }
      patch.isTransportFeatureEnabled = data.isTransportFeatureEnabled;
    }
    if (Array.isArray(data.associations)) {
      patch.associations = data.associations as City['associations'];
    }
    if (data.publicProfile && typeof data.publicProfile === 'object') {
      patch.publicProfile = data.publicProfile as City['publicProfile'];
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

    return await this.cityRepository.findOneByOrFail({ id: cityId });
  }
}
