import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiEngineService } from './ai-engine.service';

describe('AiEngineService', () => {
  let service: AiEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiEngineService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('http://ia') } },
      ],
    }).compile();
    service = module.get(AiEngineService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('enrichReport returns data on success', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ category: 'voirie', is_spam: false }),
    } as Response);
    await expect(
      service.enrichReport({ report_id: 1, tenant_id: 'c1', content: 'x' }),
    ).resolves.toMatchObject({ category: 'voirie' });
  });

  it('enrichReport returns null on http/network errors', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('err'),
    } as Response);
    await expect(
      service.enrichReport({ report_id: 1, tenant_id: 'c1', content: 'x' }),
    ).resolves.toBeNull();

    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('down'));
    await expect(
      service.enrichReport({ report_id: 1, tenant_id: 'c1', content: 'x' }),
    ).resolves.toBeNull();
  });

  it('chatCitoyen and chatAgent happy and error paths', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'ok' }),
    } as Response);
    await expect(service.chatCitoyen('1', 'hi', 'c1')).resolves.toEqual({ reply: 'ok' });

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ answer: 'a' }),
    } as Response);
    await expect(service.chatAgent('q')).resolves.toEqual({ answer: 'a' });

    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as Response);
    await expect(service.chatCitoyen('1', 'hi')).resolves.toBeNull();
    await expect(service.chatAgent('q')).resolves.toBeNull();

    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('x'));
    await expect(service.chatCitoyen('1', 'hi')).resolves.toBeNull();
    await expect(service.chatAgent('q')).resolves.toBeNull();
  });
});
