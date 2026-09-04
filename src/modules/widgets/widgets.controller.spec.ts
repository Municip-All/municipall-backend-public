import { Test, TestingModule } from '@nestjs/testing';
import { WidgetsController } from './widgets.controller';
import { WidgetsService } from './widgets.service';

describe('WidgetsController', () => {
  it('delegates to service', async () => {
    const widgetsService = {
      getAggregatedData: jest.fn().mockResolvedValue({ reportsCount: 0, reports: [] }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WidgetsController],
      providers: [{ provide: WidgetsService, useValue: widgetsService }],
    }).compile();
    const controller = module.get(WidgetsController);
    await expect(controller.getWidgetsData('city-1')).resolves.toEqual({
      reportsCount: 0,
      reports: [],
    });
    expect(widgetsService.getAggregatedData).toHaveBeenCalledWith('city-1');
  });
});
