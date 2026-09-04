import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import {
  ContactTicketsController,
  ContactMessagesLegacyController,
} from './contact-messages.controller';
import { ContactTicketsService } from './contact-tickets.service';

describe('ContactTicketsController', () => {
  let controller: ContactTicketsController;
  const service = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findAllForTenant: jest.fn(),
    findById: jest.fn(),
    reply: jest.fn(),
    updateStatus: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactTicketsController],
      providers: [{ provide: ContactTicketsService, useValue: service }],
    }).compile();
    controller = module.get(ContactTicketsController);
  });

  it('create requires auth', async () => {
    await expect(controller.create({} as never, {} as never)).rejects.toThrow(ForbiddenException);
  });

  it('delegates CRUD endpoints', async () => {
    service.create.mockResolvedValue({ id: 1 });
    service.findByUser.mockResolvedValue([]);
    service.findAllForTenant.mockResolvedValue([]);
    service.findById.mockResolvedValue({ id: 1 });
    service.reply.mockResolvedValue({ id: 1 });
    service.updateStatus.mockResolvedValue({ id: 1 });
    service.close.mockResolvedValue({ id: 1 });

    const dto = { subject: 'S', body: 'B' } as never;
    await controller.create({ tenantId: 'c1', user: { sub: 9 } } as never, dto);
    expect(service.create).toHaveBeenCalledWith('c1', 9, dto);

    await controller.findMine({ tenantId: 'c1', user: { sub: 9 } } as never);
    expect(service.findByUser).toHaveBeenCalledWith('c1', 9);

    await controller.findAllForCity({ tenantId: 'c1' } as never);
    expect(service.findAllForTenant).toHaveBeenCalledWith('c1');

    await controller.findOne({ tenantId: 'c1', user: { sub: 9, role: 'citizen' } } as never, 3);
    expect(service.findById).toHaveBeenCalledWith(3, 'c1', 9, 'citizen');

    await controller.reply({ tenantId: 'c1', user: { sub: 9, role: 'citizen' } } as never, 3, {
      body: 'hi',
    } as never);
    expect(service.reply).toHaveBeenCalledWith(3, 'c1', 9, 'citizen', { body: 'hi' });

    await controller.updateStatus({ tenantId: 'c1', user: { sub: 2 } } as never, 3, {
      status: 'Clôturé',
    } as never);
    expect(service.updateStatus).toHaveBeenCalledWith(3, 'c1', 2, 'Clôturé');

    await controller.close({ tenantId: 'c1', user: { sub: 2 } } as never, 3);
    expect(service.close).toHaveBeenCalledWith(3, 'c1', 2);
  });
});

describe('ContactMessagesLegacyController', () => {
  let controller: ContactMessagesLegacyController;
  const service = {
    create: jest.fn(),
    findByUser: jest.fn(),
    findAllForTenant: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactMessagesLegacyController],
      providers: [{ provide: ContactTicketsService, useValue: service }],
    }).compile();
    controller = module.get(ContactMessagesLegacyController);
  });

  it('delegates create/mine/findAll', async () => {
    service.create.mockResolvedValue({ id: 1 });
    service.findByUser.mockResolvedValue([]);
    service.findAllForTenant.mockResolvedValue([]);

    await controller.create(
      { tenantId: 'c1', user: { sub: 9 } } as never,
      {
        subject: 'S',
        body: 'B',
      } as never,
    );
    expect(service.create).toHaveBeenCalledWith('c1', 9, expect.any(Object));

    await controller.findMine({ tenantId: 'c1', user: { sub: 9 } } as never);
    expect(service.findByUser).toHaveBeenCalledWith('c1', 9);

    await controller.findAll({} as never);
    expect(service.findAllForTenant).toHaveBeenCalledWith('city-1');
  });

  it('requires auth on create and mine', () => {
    expect(() => controller.create({} as never, {} as never)).toThrow(ForbiddenException);
    expect(() => controller.findMine({} as never)).toThrow(ForbiddenException);
  });
});
