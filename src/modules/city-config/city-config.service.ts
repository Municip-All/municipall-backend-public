import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { User } from '../user/user.entity';
import { ContactMessage } from '../contact-messages/entities/contact-message.entity';
import { City } from './entities/city.entity';

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
    @InjectRepository(ContactMessage)
    private readonly contactMessageRepository: Repository<ContactMessage>,
  ) {}

  private isUrgentContactMessage(message: ContactMessage): boolean {
    const text = `${message.subject} ${message.body}`;
    return URGENT_KEYWORDS.test(text);
  }

  private buildAlerts(
    pendingReports: Report[],
    pendingMessages: ContactMessage[],
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

    const messageAlerts: DashboardAlert[] = pendingMessages.map((message) => ({
      id: `contact-${message.id}`,
      type: 'contact',
      severity: this.isUrgentContactMessage(message) ? 'urgent' : 'normal',
      title: `Message — ${message.subject}`,
      subtitle: message.body.slice(0, 120),
      createdAt: message.createdAt.toISOString(),
      entityId: message.id,
    }));

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

    const pendingMessages = await this.contactMessageRepository.find({
      where: { tenantId: cityId, status: 'En attente' },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    const reportsInProgressCount = await this.reportRepository.count({
      where: { tenantId: cityId, status: 'En cours' },
    });

    const pendingContactMessagesCount = pendingMessages.length;
    const activeReportsCount = pendingReports.length;
    const urgentReportsCount = pendingReports.filter((r) =>
      URGENT_REPORT_CATEGORIES.includes(r.category),
    ).length;

    const alerts = this.buildAlerts(pendingReports, pendingMessages);
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
      suggestionsCount: pendingMessages.length,
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
}
