import { Injectable } from '@nestjs/common';

export interface CityConfig {
  features: string[];
  theme: {
    primaryColor: string;
    logoUrl: string;
  };
}

@Injectable()
export class CityConfigService {
  private readonly config: Record<string, CityConfig> = {
    'city-1': {
      features: ['flux-live', 'agenda', 'reports'],
      theme: { primaryColor: '#007AFF', logoUrl: 'https://example.com/logo1.png' },
    },
  };

  getCityConfig(cityId: string): CityConfig {
    return this.config[cityId] || { features: [], theme: { primaryColor: '', logoUrl: '' } };
  }

  isFeatureEnabled(cityId: string, featureName: string): boolean {
    const cityConfig = this.getCityConfig(cityId);
    return cityConfig.features.includes(featureName);
  }
}
