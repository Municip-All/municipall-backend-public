import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../reports/entities/report.entity';
import { User } from '../user/user.entity';
import { City } from './entities/city.entity';

export interface CityConfig {
  name: string;
  features: string[];
  theme: {
    primaryColor: string;
    secondaryColor?: string;
    useGradient: boolean;
    logoUrl: string;
  };
}

export interface CityDashboardStats {
  satisfaction: number;
  satisfactionTrend: number;
  citizensCount: number;
  activeReportsCount: number;
  reportsTrend: number;
  suggestionsCount: number;
  suggestionsTrend: number;
  trendData: { name: string; satisfaction: number }[];
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
  ) {}

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
      theme: {
        primaryColor: city.primaryColor,
        secondaryColor: city.secondaryColor,
        useGradient: city.useGradient,
        logoUrl: city.logoUrl,
      },
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

    const activeReportsCount = await this.reportRepository.count({
      where: { tenantId: cityId, status: 'En attente' },
    });

    // Mock trend data and others for now as we don't have historical data yet
    return {
      satisfaction: 78,
      satisfactionTrend: 5,
      citizensCount,
      activeReportsCount,
      reportsTrend: -12,
      suggestionsCount: 312,
      suggestionsTrend: 45,
      trendData: [
        { name: 'Lun', satisfaction: 65 },
        { name: 'Mar', satisfaction: 68 },
        { name: 'Mer', satisfaction: 62 },
        { name: 'Jeu', satisfaction: 74 },
        { name: 'Ven', satisfaction: 79 },
        { name: 'Sam', satisfaction: 77 },
        { name: 'Dim', satisfaction: 84 },
      ],
    };
  }
}
