import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';

export interface CityConfig {
  features: string[];
  theme: {
    primaryColor: string;
    logoUrl: string;
  };
}

@Injectable()
export class CityConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  async onModuleInit() {
    // Seed default city if not exists (for dev purposes)
    const count = await this.cityRepository.count();
    if (count === 0) {
      await this.cityRepository.save({
        id: 'city-1',
        name: 'Antigravity City',
        primaryColor: '#244FE5',
        logoUrl: 'https://example.com/logo.png',
        features: ['flux-live', 'agenda', 'reports'],
      });
    }
  }

  async getCityConfig(cityId: string): Promise<CityConfig> {
    const city = await this.cityRepository.findOneBy({ id: cityId });
    if (!city) {
      return { features: [], theme: { primaryColor: '', logoUrl: '' } };
    }
    return {
      features: city.features,
      theme: {
        primaryColor: city.primaryColor,
        logoUrl: city.logoUrl,
      },
    };
  }

  async isFeatureEnabled(cityId: string, featureName: string): Promise<boolean> {
    const cityConfig = await this.getCityConfig(cityId);
    return cityConfig.features.includes(featureName);
  }
}
