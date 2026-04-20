import { Injectable } from '@nestjs/common';

@Injectable()
export class CityConfigService {
  private readonly config = {
    'city-1': {
      features: ['flux-live', 'agenda', 'reports'],
      theme: { primaryColor: '#007AFF', logoUrl: 'https://example.com/logo1.png' },
    },
  };

  getCityConfig(cityId: string) {
    return this.config[cityId] || { features: [], theme: {} };
  }

  isFeatureEnabled(cityId: string, featureName: string): boolean {
    const cityConfig = this.getCityConfig(cityId);
    return cityConfig.features.includes(featureName);
  }
}
