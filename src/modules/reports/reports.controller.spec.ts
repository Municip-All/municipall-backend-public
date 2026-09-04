import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUser: jest.fn(),
    findDetail: jest.fn(),
    addMessage: jest.fn(),
    updateStatus: jest.fn(),
    getClusteredReports: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: service }],
    }).compile();
    controller = module.get(ReportsController);
  });

  describe('createReport', () => {
    it('throws when no user', async () => {
      await expect(controller.createReport({} as never, {} as never)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('creates with authenticated user', async () => {
      service.create.mockResolvedValue({ id: 1 });
      const dto = { category: 'Voirie', lat: 1, lon: 2 } as never;
      await controller.createReport({ tenantId: 'c1', user: { sub: 9 } } as never, dto);
      expect(service.create).toHaveBeenCalledWith('c1', { ...dto, userId: 9 }, 9);
    });
  });

  describe('getAll', () => {
    it('lists own reports for citizen', async () => {
      service.findByUser.mockResolvedValue([]);
      await controller.getAll({ tenantId: 'c1', user: { sub: 3, role: 'citizen' } } as never);
      expect(service.findByUser).toHaveBeenCalledWith('c1', 3);
    });

    it('throws for citizen without session', async () => {
      await expect(
        controller.getAll({ tenantId: 'c1', user: { role: 'citizen' } } as never),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lists all for staff', async () => {
      service.findAll.mockResolvedValue([{ id: 1 }]);
      await expect(
        controller.getAll({ tenantId: 'c1', user: { sub: 1, role: 'agent' } } as never),
      ).resolves.toEqual([{ id: 1 }]);
      expect(service.findAll).toHaveBeenCalledWith('c1');
    });

    it('wraps unexpected errors', async () => {
      service.findAll.mockRejectedValue(new Error('db down'));
      await expect(
        controller.getAll({ tenantId: 'c1', user: { sub: 1, role: 'mayor' } } as never),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  it('getMine requires user and delegates', async () => {
    await expect(controller.getMine({} as never)).rejects.toThrow(UnauthorizedException);
    service.findByUser.mockResolvedValue([]);
    await controller.getMine({ tenantId: 'c1', user: { sub: 4 } } as never);
    expect(service.findByUser).toHaveBeenCalledWith('c1', 4);
  });

  it('getClustered / getDetail / reply / updateStatus', async () => {
    service.getClusteredReports.mockResolvedValue([]);
    await controller.getClustered({ query: { n: '1' } } as never);
    expect(service.getClusteredReports).toHaveBeenCalledWith({ n: '1' });

    await expect(controller.getDetail({} as never, 1)).rejects.toThrow(UnauthorizedException);
    service.findDetail.mockResolvedValue({ id: 1 });
    await controller.getDetail({ tenantId: 'c1', user: { sub: 2, role: 'citizen' } } as never, 1);
    expect(service.findDetail).toHaveBeenCalledWith('c1', 1, 2, 'citizen');

    service.addMessage.mockResolvedValue({ id: 1 });
    await controller.reply({ tenantId: 'c1', user: { sub: 2, role: 'citizen' } } as never, 1, {
      body: 'hi',
    } as never);
    expect(service.addMessage).toHaveBeenCalledWith('c1', 1, 2, 'hi', 'citizen');

    service.updateStatus.mockResolvedValue({ id: 1, status: 'Résolu' });
    await controller.updateStatus({ tenantId: 'c1', user: { sub: 2 } } as never, 1, {
      status: 'Résolu',
    } as never);
    expect(service.updateStatus).toHaveBeenCalledWith(1, 'Résolu', 'c1', 2);
  });
});
