import { Test, TestingModule } from '@nestjs/testing';
import { ConstructionWorksController } from './construction-works.controller';
import { ConstructionWorksService } from './construction-works.service';

describe('ConstructionWorksController', () => {
  let controller: ConstructionWorksController;
  const service = {
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConstructionWorksController],
      providers: [{ provide: ConstructionWorksService, useValue: service }],
    }).compile();
    controller = module.get(ConstructionWorksController);
  });

  it('delegates CRUD with tenant fallback', async () => {
    service.findAll.mockResolvedValue([]);
    service.create.mockResolvedValue({ id: 1 });
    service.update.mockResolvedValue({ id: 1 });
    service.remove.mockResolvedValue(undefined);
    await controller.findAll({} as never);
    expect(service.findAll).toHaveBeenCalledWith('city-1');
    const dto = { title: 'x' } as never;
    await controller.create({ tenantId: 'c1' } as never, dto);
    expect(service.create).toHaveBeenCalledWith('c1', dto);
    await controller.update(3, { tenantId: 'c1' } as never, dto);
    expect(service.update).toHaveBeenCalledWith(3, 'c1', dto);
    await controller.remove(3, { tenantId: 'c1' } as never);
    expect(service.remove).toHaveBeenCalledWith(3, 'c1');
  });
});
