import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let controller: EventsController;
  const service = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useValue: service }],
    }).compile();
    controller = module.get(EventsController);
  });

  it('findAll uses tenantId or default', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll({ tenantId: 'c1' } as never);
    expect(service.findAll).toHaveBeenCalledWith('c1');
    await controller.findAll({} as never);
    expect(service.findAll).toHaveBeenCalledWith('city-1');
  });

  it('create/update/remove delegate', async () => {
    service.create.mockResolvedValue({ id: 1 });
    service.update.mockResolvedValue({ id: 1 });
    service.remove.mockResolvedValue(undefined);
    const dto = { title: 'x' } as never;
    await controller.create({ tenantId: 'c1' } as never, dto);
    expect(service.create).toHaveBeenCalledWith('c1', dto);
    await controller.update(2, { tenantId: 'c1' } as never, dto);
    expect(service.update).toHaveBeenCalledWith(2, 'c1', dto);
    await controller.remove(2, { tenantId: 'c1' } as never);
    expect(service.remove).toHaveBeenCalledWith(2, 'c1');
  });
});
