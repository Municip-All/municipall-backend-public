import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException, BadGatewayException } from '@nestjs/common';
import { TransportService } from './transport.service';

describe('TransportService', () => {
  const make = async (env: Record<string, string | undefined>) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((k: string) => env[k]) },
        },
      ],
    }).compile();
    return module.get(TransportService);
  };

  afterEach(() => jest.restoreAllMocks());

  it('uses demo fallback when forced', async () => {
    const service = await make({ IDFM_API_KEY: 'k', IDFM_DEMO_FALLBACK: 'true' });
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('down'));
    const result = await service.getDisruptionsNear(48.8, 2.3);
    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.stops.length).toBeGreaterThan(0);
  });

  it('throws when API key missing and no demo', async () => {
    const service = await make({ IDFM_API_KEY: '', IDFM_DEMO_FALLBACK: 'false' });
    await expect(service.getDisruptionsNear(48.8, 2.3)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('maps successful PRIM responses', async () => {
    const service = await make({ IDFM_API_KEY: 'key', IDFM_DEMO_FALLBACK: 'false' });
    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/lines')) {
        return {
          ok: true,
          json: async () => ({
            lines: [
              {
                id: 'line-1',
                name: 'Métro 7',
                commercial_mode: { name: 'Metro' },
              },
              { id: 'line-2', name: 'Bus 47', commercial_mode: { name: 'Bus' } },
            ],
            disruptions: [
              {
                messages: [{ text: '<b>Interrompu</b>' }, 'Texte'],
                impacted_objects: [
                  { pt_object: { embedded_type: 'line', id: 'line-1' } },
                  { pt_object: { embedded_type: 'stop_area', id: 'stop-1' } },
                ],
              },
            ],
          }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({
          places_nearby: [
            {
              embedded_type: 'stop_area',
              id: 'stop-1',
              name: 'Porte',
              stop_area: {
                id: 'stop-1',
                name: 'Porte',
                coord: { lat: '48.8', lon: '2.3' },
                commercial_modes: [{ name: 'metro' }],
              },
            },
          ],
        }),
      } as Response;
    });

    const result = await service.getDisruptionsNear(48.8, 2.3);
    expect(result.lines[0].status).toBe('disrupted');
    expect(result.stops[0].stopId).toBe('stop-1');
  });

  it('rethrows auth errors without demo fallback', async () => {
    const service = await make({ IDFM_API_KEY: 'key', IDFM_DEMO_FALLBACK: 'false' });
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);
    await expect(service.getDisruptionsNear(48.8, 2.3)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('throws BadGateway on other HTTP errors without demo', async () => {
    const service = await make({ IDFM_API_KEY: 'key', IDFM_DEMO_FALLBACK: 'false' });
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);
    await expect(service.getDisruptionsNear(48.8, 2.3)).rejects.toThrow(BadGatewayException);
  });
});
