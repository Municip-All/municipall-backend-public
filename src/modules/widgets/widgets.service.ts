import { Injectable } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service';
import { WeatherService } from '../weather/weather.service';

@Injectable()
export class WidgetsService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly weatherService: WeatherService,
  ) {}

  async getAggregatedData(cityId: string) {
    const reports = await this.reportsService.findAll(cityId);
    return { reportsCount: reports.length, reports };
  }
}
