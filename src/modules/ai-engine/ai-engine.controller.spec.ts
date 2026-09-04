import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AiEngineController } from './ai-engine.controller';
import { AiEngineService } from './ai-engine.service';

describe('AiEngineController', () => {
  let controller: AiEngineController;
  const service = {
    chatCitoyen: jest.fn(),
    chatAgent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiEngineController],
      providers: [{ provide: AiEngineService, useValue: service }],
    }).compile();
    controller = module.get(AiEngineController);
  });

  describe('chatCitoyen', () => {
    it('returns chat result', async () => {
      service.chatCitoyen.mockResolvedValue({ reply: 'bonjour' });
      await expect(
        controller.chatCitoyen({ user_id: 'u1', message: 'hi', tenant_id: 'c1' } as never),
      ).resolves.toEqual({ reply: 'bonjour' });
      expect(service.chatCitoyen).toHaveBeenCalledWith('u1', 'hi', 'c1');
    });

    it('uses header tenant when dto omits tenant_id', async () => {
      service.chatCitoyen.mockResolvedValue({ reply: 'ok' });
      await controller.chatCitoyen({ user_id: 'u1', message: 'hi' } as never, 'header-city');
      expect(service.chatCitoyen).toHaveBeenCalledWith('u1', 'hi', 'header-city');
    });

    it('throws when service unavailable', async () => {
      service.chatCitoyen.mockResolvedValue(null);
      await expect(
        controller.chatCitoyen({ user_id: 'u1', message: 'hi' } as never),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('chatAgent', () => {
    it('returns agent result with tenant from request', async () => {
      service.chatAgent.mockResolvedValue({ answer: 'x' });
      await expect(
        controller.chatAgent(
          { tenantId: 'c1', user: { cityId: 'other' } } as never,
          { question: 'q' } as never,
        ),
      ).resolves.toEqual({ answer: 'x' });
      expect(service.chatAgent).toHaveBeenCalledWith('q', 'c1');
    });

    it('throws when service unavailable', async () => {
      service.chatAgent.mockResolvedValue(null);
      await expect(
        controller.chatAgent({} as never, { question: 'q', tenant_id: 'c1' } as never),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
