import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

describe('WeatherController', () => {
  let controller: WeatherController;
  const weatherService = { getWeather: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [{ provide: WeatherService, useValue: weatherService }],
    }).compile();
    controller = module.get(WeatherController);
  });

  it('rejects invalid coordinates', async () => {
    await expect(controller.getWeather('x', '2')).rejects.toThrow(BadRequestException);
  });

  it('returns weather for valid coords', async () => {
    weatherService.getWeather.mockResolvedValue({ temp: 20 });
    await expect(controller.getWeather('48.8', '2.3')).resolves.toEqual({ temp: 20 });
    expect(weatherService.getWeather).toHaveBeenCalledWith(48.8, 2.3);
  });
});
