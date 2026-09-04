import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';
import { Invitation } from './entities/invitation.entity';
import { AuditService } from '../audit/audit.service';
import { FeedbackService } from '../feedback/feedback.service';

const bcryptHash = jest.fn();

jest.mock(
  'bcrypt',
  () => ({
    hash: (...args: unknown[]) => bcryptHash(...args),
    compare: jest.fn(),
  }),
  { virtual: true },
);

jest.mock('os', () => ({
  totalmem: jest.fn(() => 8 * 1024 ** 3),
  freemem: jest.fn(() => 4 * 1024 ** 3),
  loadavg: jest.fn(() => [1, 1, 1]),
  cpus: jest.fn(() => [{}, {}]),
  uptime: jest.fn(() => 3600),
  platform: jest.fn(() => 'linux'),
}));

describe('AdminService', () => {
  let service: AdminService;

  const userRepo = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const cityRepo = {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    query: jest.fn(),
  };
  const invitationRepo = {
    count: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };
  const feedbackService = { listForMayor: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    bcryptHash.mockResolvedValue('hashed');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(City), useValue: cityRepo },
        { provide: getRepositoryToken(Invitation), useValue: invitationRepo },
        { provide: AuditService, useValue: auditService },
        { provide: FeedbackService, useValue: feedbackService },
      ],
    }).compile();
    service = module.get(AdminService);
  });

  describe('getBusinessStats', () => {
    it('aggregates counts and satisfaction', async () => {
      userRepo.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(80);
      cityRepo.count.mockResolvedValue(5);
      feedbackService.listForMayor.mockResolvedValue([{ stars: 4 }, { stars: 5 }]);

      await expect(service.getBusinessStats()).resolves.toEqual({
        cities: 5,
        users: 100,
        agents: 10,
        citizens: 80,
        satisfaction: 0.9,
      });
    });

    it('returns satisfaction 0 when feedback fails', async () => {
      userRepo.count.mockResolvedValue(0);
      cityRepo.count.mockResolvedValue(0);
      feedbackService.listForMayor.mockRejectedValue(new Error('down'));

      await expect(service.getBusinessStats()).resolves.toMatchObject({ satisfaction: 0 });
    });
  });

  it('getSystemStats returns cpu/memory shape', async () => {
    const stats = await service.getSystemStats();
    expect(stats).toEqual({
      cpu: { load: 50, cores: 2 },
      memory: { total: 8, used: 4, percentage: 50 },
      uptime: 3600,
      platform: 'linux',
    });
  });

  it('findAllUsers returns users', async () => {
    userRepo.find.mockResolvedValue([{ id: 1, email: 'a@b.c' }]);
    await expect(service.findAllUsers()).resolves.toEqual([{ id: 1, email: 'a@b.c' }]);
  });

  describe('findUserById', () => {
    it('returns user', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(service.findUserById(1)).resolves.toEqual({ id: 1 });
    });

    it('throws when missing', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.findUserById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUser', () => {
    const baseUser = {
      id: 1,
      name: 'Jean',
      surname: 'Dupont',
      email: 'j@d.fr',
      role: 'citizen',
      cityId: 'city-1',
      avatar_url: undefined,
      points: 0,
      neighborhood: undefined,
      created_at: new Date(),
      update_at: new Date(),
      password: 'old',
    };

    it('updates fields, normalizes role, hashes password', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser });
      cityRepo.findOne.mockResolvedValue({ id: 'city-1' });
      userRepo.save.mockImplementation(async (u) => u);

      const result = await service.updateUser(1, {
        name: ' Marie ',
        role: 'Maire',
        cityId: 'city-1',
        password: 'secret',
      } as never);

      expect(result.name).toBe('Marie');
      expect(result.role).toBe('mayor');
      expect(bcryptHash).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('throws when user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.updateUser(1, {} as never)).rejects.toThrow(NotFoundException);
    });

    it('rejects invalid role', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser });
      await expect(service.updateUser(1, { role: 'hacker' } as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects staff without city', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser, cityId: undefined });
      await expect(service.updateUser(1, { role: 'agent' } as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects unknown city', async () => {
      userRepo.findOne.mockResolvedValue({ ...baseUser });
      cityRepo.findOne.mockResolvedValue(null);
      await expect(service.updateUser(1, { cityId: 'missing' } as never)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteUser', () => {
    it('removes user and audits', async () => {
      const user = { id: 1, email: 'a@b.c', role: 'citizen', cityId: 'c1' };
      userRepo.findOne.mockResolvedValue(user);
      await service.deleteUser(1);
      expect(auditService.log).toHaveBeenCalled();
      expect(userRepo.remove).toHaveBeenCalledWith(user);
    });

    it('throws when missing', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteUser(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cities', () => {
    it('findAllCities returns cities', async () => {
      cityRepo.find.mockResolvedValue([{ id: 'c1' }]);
      await expect(service.findAllCities()).resolves.toEqual([{ id: 'c1' }]);
    });

    it('findAllCities falls back then empty on errors', async () => {
      cityRepo.find.mockRejectedValueOnce(new Error('geom')).mockRejectedValueOnce(new Error('fatal'));
      await expect(service.findAllCities()).resolves.toEqual([]);
    });

    it('createCity saves and optionally sets boundary', async () => {
      const created = { id: 'c1', name: 'Paris' };
      cityRepo.create.mockReturnValue(created);
      cityRepo.save.mockResolvedValue(created);
      cityRepo.query.mockResolvedValue(undefined);

      const result = await service.createCity({
        id: 'c1',
        name: 'Paris',
        boundary: { type: 'Polygon', coordinates: [] },
      } as never);

      expect(result).toEqual(created);
      expect(cityRepo.query).toHaveBeenCalled();
    });

    it('updateCity maps fields and returns city', async () => {
      cityRepo.update.mockResolvedValue({ affected: 1 });
      cityRepo.findOneBy.mockResolvedValue({ id: 'c1', name: 'Lyon' });
      await expect(service.updateCity('c1', { name: 'Lyon' } as never)).resolves.toEqual({
        id: 'c1',
        name: 'Lyon',
      });
      expect(cityRepo.update).toHaveBeenCalledWith('c1', expect.objectContaining({ name: 'Lyon' }));
    });

    it('deleteCity deletes by id', async () => {
      cityRepo.delete.mockResolvedValue({ affected: 1 });
      await service.deleteCity('c1');
      expect(cityRepo.delete).toHaveBeenCalledWith('c1');
    });

    it('getCityStats aggregates per city', async () => {
      cityRepo.find.mockResolvedValue([{ id: 'c1', name: 'Paris' }]);
      userRepo.count.mockResolvedValueOnce(20).mockResolvedValueOnce(3);
      invitationRepo.count.mockResolvedValue(2);
      await expect(service.getCityStats()).resolves.toEqual([
        { name: 'Paris', users: 20, agents: 3, pending: 2 },
      ]);
    });

    it('getCityAgents filters staff roles', async () => {
      userRepo.find.mockResolvedValue([
        { id: 1, role: 'agent' },
        { id: 2, role: 'citizen' },
        { id: 3, role: 'mayor' },
      ]);
      const agents = await service.getCityAgents('c1');
      expect(agents.map((a) => a.id)).toEqual([1, 3]);
    });
  });

  describe('invitations', () => {
    it('getCityInvitations lists pending', async () => {
      invitationRepo.find.mockResolvedValue([{ id: 1 }]);
      await expect(service.getCityInvitations('c1')).resolves.toEqual([{ id: 1 }]);
    });

    it('cancelInvitation deletes pending', async () => {
      invitationRepo.findOneBy.mockResolvedValue({ id: 1, status: 'pending' });
      await service.cancelInvitation(1);
      expect(invitationRepo.delete).toHaveBeenCalledWith(1);
    });

    it('cancelInvitation throws when missing or not pending', async () => {
      invitationRepo.findOneBy.mockResolvedValue(null);
      await expect(service.cancelInvitation(1)).rejects.toThrow(NotFoundException);
      invitationRepo.findOneBy.mockResolvedValue({ id: 1, status: 'accepted' });
      await expect(service.cancelInvitation(1)).rejects.toThrow(BadRequestException);
    });

    it('forceAcceptInvitation creates dummy agent', async () => {
      const invitation = {
        id: 1,
        email: 'a@b.c',
        name: 'Alex',
        role: 'assistant',
        cityId: 'c1',
        status: 'pending',
      };
      invitationRepo.findOneBy.mockResolvedValue(invitation);
      invitationRepo.save.mockResolvedValue({ ...invitation, status: 'accepted' });
      const agent = { id: 9, email: 'a@b.c' };
      userRepo.create.mockReturnValue(agent);
      userRepo.save.mockResolvedValue(agent);

      await expect(service.forceAcceptInvitation(1)).resolves.toEqual(agent);
      expect(bcryptHash).toHaveBeenCalled();
    });

    it('forceAcceptInvitation returns null when missing', async () => {
      invitationRepo.findOneBy.mockResolvedValue(null);
      await expect(service.forceAcceptInvitation(1)).resolves.toBeNull();
    });
  });

  it('getRecentActivity merges and sorts', async () => {
    const t1 = new Date('2026-01-02');
    const t2 = new Date('2026-01-01');
    userRepo.find.mockResolvedValue([
      { name: 'A', surname: 'B', role: 'agent', created_at: t2, cityId: 'c1' },
      { name: 'C', surname: 'D', role: 'citizen', created_at: t1, cityId: 'c1' },
    ]);
    cityRepo.find.mockResolvedValue([{ name: 'Paris', createdAt: t1, id: 'c1' }]);
    const activity = await service.getRecentActivity();
    expect(activity[0].type).toBe('user');
    expect(activity.length).toBe(3);
  });
});
