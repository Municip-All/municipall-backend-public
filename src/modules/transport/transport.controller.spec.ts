import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';
import { CityConfigService } from '../city-config/city-config.service';

describe('TransportController', () => {
  let controller: TransportController;
  const transportService = { getDisruptionsNear: jest.fn() };
  const cityConfigService = { assertTransportAccess: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransportController],
      providers: [
        { provide: TransportService, useValue: transportService },
        { provide: CityConfigService, useValue: cityConfigService },
      ],
    }).compile();
    controller = module.get(TransportController);
  });

  it('validates coordinates and delegates', async () => {
    await expect(controller.getDisruptions('c1', Number.NaN, 2)).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.getDisruptions('c1', 91, 2)).rejects.toThrow(BadRequestException);
    transportService.getDisruptionsNear.mockResolvedValue({ lines: [], stops: [] });
    cityConfigService.assertTransportAccess.mockResolvedValue(undefined);
    await controller.getDisruptions('c1', 48.8, 2.3);
    expect(cityConfigService.assertTransportAccess).toHaveBeenCalledWith('c1');
    expect(transportService.getDisruptionsNear).toHaveBeenCalledWith(48.8, 2.3);
  });
});
