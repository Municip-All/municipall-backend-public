import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConstructionWorksService } from './construction-works.service';
import { ConstructionWork } from './entities/construction-work.entity';

describe('ConstructionWorksService', () => {
  let service: ConstructionWorksService;
  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConstructionWorksService,
        { provide: getRepositoryToken(ConstructionWork), useValue: repo },
      ],
    }).compile();
    service = module.get(ConstructionWorksService);
  });

  it('findAll returns works', async () => {
    repo.find.mockResolvedValue([{ id: 1 }]);
    await expect(service.findAll('city-1')).resolves.toEqual([{ id: 1 }]);
  });

  it('findOne throws when missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(1, 'city-1')).rejects.toThrow(NotFoundException);
  });

  it('create saves work', async () => {
    const dto = {
      title: 'Chantier',
      description: 'd',
      locationName: 'Rue',
      status: 'planned',
      impactType: 'road',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
    };
    const created = { id: 1 };
    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(created);
    await expect(service.create('city-1', dto as never)).resolves.toEqual(created);
  });

  it('update patches all fields', async () => {
    const work = {
      id: 1,
      tenantId: 'city-1',
      title: 'a',
      description: 'b',
      locationName: 'c',
      status: 'planned',
      impactType: 'road',
    };
    repo.findOne.mockResolvedValue(work);
    repo.save.mockImplementation(async (w) => w);
    const result = await service.update(1, 'city-1', {
      title: 't',
      description: 'd',
      locationName: 'l',
      status: 'active',
      impactType: 'noise',
      startDate: '2026-02-01',
      endDate: '2026-02-10',
    } as never);
    expect(result.title).toBe('t');
    expect(result.status).toBe('active');
  });

  it('remove deletes work', async () => {
    const work = { id: 1 };
    repo.findOne.mockResolvedValue(work);
    await service.remove(1, 'city-1');
    expect(repo.remove).toHaveBeenCalledWith(work);
  });
});
