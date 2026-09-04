import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';

describe('EventsService', () => {
  let service: EventsService;
  const repo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService, { provide: getRepositoryToken(Event), useValue: repo }],
    }).compile();
    service = module.get(EventsService);
  });

  it('findAll returns events for city', async () => {
    repo.find.mockResolvedValue([{ id: 1 }]);
    await expect(service.findAll('city-1')).resolves.toEqual([{ id: 1 }]);
    expect(repo.find).toHaveBeenCalledWith({
      where: { cityId: 'city-1' },
      order: { startDate: 'ASC' },
    });
  });

  it('findOne throws when missing', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findOne(9, 'city-1')).rejects.toThrow(NotFoundException);
  });

  it('findOne returns event', async () => {
    const event = { id: 1, cityId: 'city-1' };
    repo.findOneBy.mockResolvedValue(event);
    await expect(service.findOne(1, 'city-1')).resolves.toEqual(event);
  });

  it('create saves event with dates', async () => {
    const dto = {
      title: 'Fête',
      description: 'desc',
      location: 'Place',
      startDate: '2026-01-01T10:00:00.000Z',
      endDate: '2026-01-01T12:00:00.000Z',
    };
    const created = { id: 1, ...dto, cityId: 'city-1' };
    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(created);
    const result = await service.create('city-1', dto as never);
    expect(repo.create).toHaveBeenCalled();
    expect(result).toEqual(created);
  });

  it('update patches fields and dates', async () => {
    const event = {
      id: 1,
      cityId: 'city-1',
      title: 'Old',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-02'),
    };
    repo.findOneBy.mockResolvedValue(event);
    repo.save.mockImplementation(async (e) => e);
    const result = await service.update(1, 'city-1', {
      title: 'New',
      startDate: '2026-02-01T00:00:00.000Z',
      endDate: '2026-02-02T00:00:00.000Z',
    } as never);
    expect(result.title).toBe('New');
    expect(repo.save).toHaveBeenCalled();
  });

  it('remove deletes event', async () => {
    const event = { id: 1, cityId: 'city-1' };
    repo.findOneBy.mockResolvedValue(event);
    repo.remove.mockResolvedValue(undefined);
    await service.remove(1, 'city-1');
    expect(repo.remove).toHaveBeenCalledWith(event);
  });
});
