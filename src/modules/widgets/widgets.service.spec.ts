import { Test, TestingModule } from '@nestjs/testing';
import { WidgetsService } from './widgets.service';
import { ReportsService } from '../reports/reports.service';
import { WeatherService } from '../weather/weather.service';

describe('WidgetsService', () => {
  let service: WidgetsService;
  const reportsService = { findAll: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetsService,
        { provide: ReportsService, useValue: reportsService },
        { provide: WeatherService, useValue: {} },
      ],
    }).compile();
    service = module.get(WidgetsService);
  });

  it('aggregates reports', async () => {
    reportsService.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    await expect(service.getAggregatedData('city-1')).resolves.toEqual({
      reportsCount: 2,
      reports: [{ id: 1 }, { id: 2 }],
    });
  });
});
