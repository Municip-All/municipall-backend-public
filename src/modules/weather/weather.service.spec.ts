import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { WeatherService } from './weather.service';

describe('WeatherService', () => {
  const makeService = async (apiKey: string) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(apiKey) } },
      ],
    }).compile();
    return module.get(WeatherService);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws when API key missing', async () => {
    const service = await makeService('');
    await expect(service.getWeather(48.8, 2.3)).rejects.toThrow(ServiceUnavailableException);
  });

  it('returns mapped weather data', async () => {
    const service = await makeService('key');
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          main: { temp: 18.6 },
          weather: [{ description: 'nuageux', icon: '04d' }],
          name: 'Paris',
        }),
    } as Response);
    await expect(service.getWeather(48.8, 2.3)).resolves.toEqual({
      temp: 19,
      description: 'nuageux',
      icon: '04d',
      city: 'Paris',
    });
  });

  it('throws BadGateway when API not ok', async () => {
    const service = await makeService('key');
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);
    await expect(service.getWeather(48.8, 2.3)).rejects.toThrow(BadGatewayException);
  });

  it('throws BadGateway when fetch fails', async () => {
    const service = await makeService('key');
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network'));
    await expect(service.getWeather(48.8, 2.3)).rejects.toThrow(BadGatewayException);
  });
});
