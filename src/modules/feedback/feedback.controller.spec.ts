import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

describe('FeedbackController', () => {
  let controller: FeedbackController;
  const service = {
    submit: jest.fn(),
    listForMayor: jest.fn(),
    getSatisfactionSummary: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [{ provide: FeedbackService, useValue: service }],
    }).compile();
    controller = module.get(FeedbackController);
  });

  it('create requires authenticated user', async () => {
    await expect(controller.create({} as never, { stars: 5 } as never)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('create submits feedback', async () => {
    service.submit.mockResolvedValue({ stars: 5 });
    const dto = { resourceType: 'report', resourceId: 1, stars: 5 } as never;
    await expect(
      controller.create({ tenantId: 'c1', user: { sub: 9 } } as never, dto),
    ).resolves.toEqual({ stars: 5 });
    expect(service.submit).toHaveBeenCalledWith('c1', 9, dto);
  });

  it('listForMayor uses tenant fallback', async () => {
    service.listForMayor.mockResolvedValue([]);
    await controller.listForMayor({} as never);
    expect(service.listForMayor).toHaveBeenCalledWith('city-1');
  });

  it('summary delegates', async () => {
    service.getSatisfactionSummary.mockResolvedValue({ satisfaction: 80 });
    await expect(controller.summary({ tenantId: 'c1' } as never)).resolves.toEqual({
      satisfaction: 80,
    });
    expect(service.getSatisfactionSummary).toHaveBeenCalledWith('c1');
  });
});
