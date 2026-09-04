import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';

const bcryptCompare = jest.fn();
const bcryptHash = jest.fn();

jest.mock(
  'bcrypt',
  () => ({
    compare: (...args: unknown[]) => bcryptCompare(...args) as Promise<boolean>,
    hash: (...args: unknown[]) => bcryptHash(...args) as Promise<string>,
  }),
  { virtual: true },
);

describe('UserService', () => {
  let service: UserService;
  const qb = {
    where: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const repo = {
    createQueryBuilder: jest.fn(() => qb),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    manager: { count: jest.fn() },
  };

  const baseUser = {
    id: 1,
    email: 'a@b.c',
    name: 'A',
    surname: 'B',
    password: 'hash',
    points: 10,
    preferences: {},
  } as User;

  beforeEach(async () => {
    jest.clearAllMocks();
    bcryptCompare.mockReset();
    bcryptHash.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: getRepositoryToken(User), useValue: repo }],
    }).compile();
    service = module.get(UserService);
  });

  it('findByEmail / findById / findByIdWithPassword', async () => {
    qb.getOne.mockResolvedValue(baseUser);
    await expect(service.findByEmail('a@b.c')).resolves.toEqual(baseUser);
    repo.findOne.mockResolvedValue(baseUser);
    await expect(service.findById(1)).resolves.toEqual(baseUser);
    await expect(service.findByIdWithPassword(1)).resolves.toEqual(baseUser);
  });

  it('updateAvatar throws and updates', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.updateAvatar(1, 'u')).rejects.toThrow(NotFoundException);
    repo.findOne.mockResolvedValue({ ...baseUser });
    repo.save.mockImplementation((u: User) => Promise.resolve(u));
    const result = await service.updateAvatar(1, 'http://x');
    expect(result.avatar_url).toBe('http://x');
  });

  it('updateProfile updates fields', async () => {
    repo.findOne.mockResolvedValue({ ...baseUser });
    repo.save.mockImplementation((u: User) => Promise.resolve(u));
    const result = await service.updateProfile(1, {
      name: 'N',
      surname: 'S',
      email: 'n@e.c',
      neighborhood: 'Q',
      cityId: 'c1',
    });
    expect(result.name).toBe('N');
    expect(result.cityId).toBe('c1');
  });

  it('updatePassword validates and hashes', async () => {
    qb.getOne.mockResolvedValue(null);
    await expect(
      service.updatePassword(1, { current: 'a', new: 'b', confirm: 'b' }),
    ).rejects.toThrow(NotFoundException);

    qb.getOne.mockResolvedValue({ ...baseUser });
    await expect(
      service.updatePassword(1, { current: 'a', new: 'b', confirm: 'c' }),
    ).rejects.toThrow(BadRequestException);

    bcryptCompare.mockResolvedValue(false);
    await expect(
      service.updatePassword(1, { current: 'a', new: 'b', confirm: 'b' }),
    ).rejects.toThrow(BadRequestException);

    bcryptCompare.mockResolvedValue(true);
    bcryptHash.mockResolvedValue('newhash');
    repo.save.mockImplementation((u: User) => Promise.resolve(u));
    const result = await service.updatePassword(1, {
      current: 'old',
      new: 'new',
      confirm: 'new',
    });
    expect(result.password).toBe('newhash');
  });

  it('push token / preferences / stats / create / delete', async () => {
    repo.findOne.mockResolvedValue({ ...baseUser });
    repo.save.mockImplementation((u: User) => Promise.resolve(u));
    await expect(service.updatePushToken(1, 'tok')).resolves.toMatchObject({
      expoPushToken: 'tok',
    });

    await expect(service.getNotificationPreferences(1)).resolves.toMatchObject({
      moderationAlerts: expect.any(Boolean) as unknown as boolean,
    });

    const prefs = await service.updateNotificationPreferences(1, {
      moderationAlerts: false,
    } as never);
    expect(prefs.moderationAlerts).toBe(false);

    repo.manager.count.mockResolvedValue(2);
    await expect(service.getStats(1)).resolves.toEqual({
      reports: 2,
      participations: 0,
      points: 10,
    });

    repo.create.mockReturnValue(baseUser);
    repo.save.mockResolvedValue(baseUser);
    await expect(service.create({ email: 'x' } as never)).resolves.toEqual(baseUser);

    await service.deleteUser(1);
    expect(repo.delete).toHaveBeenCalledWith({ id: 1 });
  });

  it('preferences throw when user missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.getNotificationPreferences(1)).rejects.toThrow(BadRequestException);
    await expect(service.updateNotificationPreferences(1, {} as never)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.getStats(1)).rejects.toThrow(NotFoundException);
    await expect(service.updatePushToken(1, 't')).rejects.toThrow(NotFoundException);
    await expect(service.updateProfile(1, {})).rejects.toThrow(NotFoundException);
  });
});
