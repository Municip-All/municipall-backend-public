import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CityConfigController } from './city-config.controller';
import { CityConfigService } from './city-config.service';

describe('CityConfigController', () => {
  let controller: CityConfigController;
  const service = {
    findAllActive: jest.fn(),
    findByLocation: jest.fn(),
    getCityConfig: jest.fn(),
    getCityBoundaryGeoJson: jest.fn(),
    getDashboardStats: jest.fn(),
    updateCityConfig: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CityConfigController],
      providers: [{ provide: CityConfigService, useValue: service }],
    }).compile();
    controller = module.get(CityConfigController);
  });

  it('listCities delegates', async () => {
    service.findAllActive.mockResolvedValue([{ id: 'c1' }]);
    await expect(controller.listCities()).resolves.toEqual([{ id: 'c1' }]);
  });

  it('detectCity throws when none found', async () => {
    service.findByLocation.mockResolvedValue(null);
    await expect(controller.detectCity(1, 2)).rejects.toThrow(NotFoundException);
  });

  it('detectCity merges id and config', async () => {
    service.findByLocation.mockResolvedValue({ id: 'c1' });
    service.getCityConfig.mockResolvedValue({ name: 'Ville', features: [], theme: {} });
    await expect(controller.detectCity(48.8, 2.3)).resolves.toMatchObject({
      id: 'c1',
      name: 'Ville',
    });
  });

  it('getConfig / dashboard / update', async () => {
    service.getCityConfig.mockResolvedValue({ name: 'V' });
    await controller.getConfig('c1');
    expect(service.getCityConfig).toHaveBeenCalledWith('c1');

    service.getDashboardStats.mockResolvedValue({ citizensCount: 1 });
    await controller.getDashboardStats('c1');
    expect(service.getDashboardStats).toHaveBeenCalledWith('c1');

    service.updateCityConfig.mockResolvedValue({ id: 'c1' });
    await controller.updateConfig('c1', { name: 'N' } as never, { user: { sub: 9 } } as never);
    expect(service.updateCityConfig).toHaveBeenCalledWith('c1', { name: 'N' }, 9);
  });

  it('getBoundary throws when missing', async () => {
    service.getCityBoundaryGeoJson.mockResolvedValue(null);
    await expect(controller.getBoundary('c1')).rejects.toThrow(NotFoundException);
  });

  it('getBoundary returns feature', async () => {
    const feature = { type: 'Feature', geometry: {}, properties: { name: 'V' } };
    service.getCityBoundaryGeoJson.mockResolvedValue(feature);
    await expect(controller.getBoundary('c1')).resolves.toEqual(feature);
  });
});
