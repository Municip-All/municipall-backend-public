import { Injectable } from '@nestjs/common';

@Injectable()
export class WidgetsService {
  getAggregatedData(_cityId: string) {
    // Logic to aggregate data for external widgets (weather, traffic, social)
    return { weather: {}, reportsCount: 5 };
  }
}
