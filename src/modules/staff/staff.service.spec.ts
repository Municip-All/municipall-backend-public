import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { User } from '../user/user.entity';
import { Invitation } from '../admin/entities/invitation.entity';
import { Report } from '../reports/entities/report.entity';
import { City } from '../city-config/entities/city.entity';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../../core/auth/auth.service';

const bcryptHash = jest.fn();

jest.mock(
  'bcrypt',
  () => ({
    hash: (...args: unknown[]) => bcryptHash(...args),
    compare: jest.fn(),
  }),
  { virtual: true },
);

describe('StaffService', () => {
  let service: StaffService;

  const userRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const invitationRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const reportRepo = {
    query: jest.fn(),
  };
  const cityRepo = {
    findOne: jest.fn(),
  };
  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
    aggregateTeamKpis: jest.fn(),
    findByTenant: jest.fn(),
  };
  const authService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    bcryptHash.mockResolvedValue('hashed');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Invitation), useValue: invitationRepo },
        { provide: getRepositoryToken(Report), useValue: reportRepo },
        { provide: getRepositoryToken(City), useValue: cityRepo },
        { provide: AuditService, useValue: auditService },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();
    service = module.get(StaffService);
  });

  describe('getInvitationPreview', () => {
    it('throws when invitation missing', async () => {
      invitationRepo.findOne.mockResolvedValue(null);
      await expect(service.getInvitationPreview('tok')).rejects.toThrow(NotFoundException);
    });

    it('returns preview with city name', async () => {
      invitationRepo.findOne.mockResolvedValue({
        email: 'a@b.c',
        name: 'Ann',
        role: 'agent',
        cityId: 'c1',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
      });
      cityRepo.findOne.mockResolvedValue({ name: 'Ville' });
      const result = await service.getInvitationPreview('tok');
      expect(result).toMatchObject({
        email: 'a@b.c',
        cityName: 'Ville',
        status: 'pending',
      });
    });

    it('marks expired invitations', async () => {
      invitationRepo.findOne.mockResolvedValue({
        email: 'a@b.c',
        name: 'Ann',
        role: 'agent',
        cityId: 'c1',
        status: 'pending',
        expiresAt: new Date(Date.now() - 1000),
      });
      cityRepo.findOne.mockResolvedValue(null);
      const result = await service.getInvitationPreview('tok');
      expect(result.status).toBe('expired');
      expect(result.cityName).toBe('c1');
    });
  });

  describe('listTeam', () => {
    it('filters staff roles only', async () => {
      const created = new Date('2026-01-01T00:00:00.000Z');
      userRepo.find.mockResolvedValue([
        {
          id: 1,
          name: 'M',
          surname: 'A',
          email: 'm@x',
          role: 'mayor',
          created_at: created,
        },
        {
          id: 2,
          name: 'C',
          surname: '',
          email: 'c@x',
          role: 'citizen',
          created_at: created,
        },
        {
          id: 3,
          name: 'Ag',
          surname: 'Ent',
          email: 'ag@x',
          role: 'agent',
          created_at: created,
        },
      ]);
      const result = await service.listTeam('c1');
      expect(result).toHaveLength(2);
      expect(result.map((m) => m.id)).toEqual([1, 3]);
    });
  });

  describe('createInvitation', () => {
    it('throws when email already exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(
        service.createInvitation('c1', 9, { email: 'a@b.c', name: 'A', role: 'agent' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates invitation and audits', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const invitation = {
        id: 5,
        email: 'a@b.c',
        name: 'A',
        role: 'agent',
        status: 'pending',
        expiresAt: new Date('2026-04-01T00:00:00.000Z'),
        token: 'tok',
      };
      invitationRepo.create.mockImplementation((d) => ({ ...d, id: 5 }));
      invitationRepo.save.mockResolvedValue(invitation);

      const result = await service.createInvitation('c1', 9, {
        email: 'a@b.c',
        name: 'A',
        role: 'agent',
      });
      expect(result).toMatchObject({
        id: 5,
        email: 'a@b.c',
        acceptPath: expect.stringMatching(/^\/invite\//),
      });
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('acceptInvitation', () => {
    it('throws when invitation invalid', async () => {
      invitationRepo.findOne.mockResolvedValue(null);
      await expect(
        service.acceptInvitation({
          token: 'x',
          name: 'N',
          surname: 'S',
          password: 'pass',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when invitation expired', async () => {
      invitationRepo.findOne.mockResolvedValue({
        token: 'x',
        status: 'pending',
        expiresAt: new Date(Date.now() - 1000),
      });
      invitationRepo.save.mockResolvedValue(undefined);
      await expect(
        service.acceptInvitation({
          token: 'x',
          name: 'N',
          surname: 'S',
          password: 'pass',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates user and returns login', async () => {
      const invitation = {
        id: 1,
        email: 'a@b.c',
        role: 'agent',
        cityId: 'c1',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
      };
      invitationRepo.findOne.mockResolvedValue(invitation);
      const user = { id: 42, email: 'a@b.c', role: 'agent', cityId: 'c1' };
      userRepo.create.mockReturnValue(user);
      userRepo.save.mockResolvedValue(user);
      invitationRepo.save.mockResolvedValue(invitation);
      authService.login.mockResolvedValue({ access_token: 'jwt' });

      const result = await service.acceptInvitation({
        token: 'tok',
        name: 'N',
        surname: 'S',
        password: 'secret',
      });
      expect(bcryptHash).toHaveBeenCalledWith('secret', 12);
      expect(authService.login).toHaveBeenCalledWith(user, { backofficeOnly: true });
      expect(result).toEqual({ access_token: 'jwt' });
    });
  });

  describe('createMayor', () => {
    it('throws on duplicate email', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(
        service.createMayor({
          email: 'a@b.c',
          name: 'N',
          surname: 'S',
          password: 'p',
          cityId: 'c1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates mayor', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const mayor = {
        id: 10,
        email: 'a@b.c',
        role: 'mayor',
        cityId: 'c1',
      };
      userRepo.create.mockReturnValue(mayor);
      userRepo.save.mockResolvedValue(mayor);
      await expect(
        service.createMayor({
          email: 'a@b.c',
          name: 'N',
          surname: 'S',
          password: 'p',
          cityId: 'c1',
        }),
      ).resolves.toEqual({
        id: 10,
        email: 'a@b.c',
        role: 'mayor',
        cityId: 'c1',
      });
    });
  });

  describe('getTeamKpis', () => {
    it('aggregates KPIs per team member', async () => {
      const created = new Date('2026-01-01T00:00:00.000Z');
      userRepo.find.mockResolvedValue([
        {
          id: 1,
          name: 'M',
          surname: 'A',
          email: 'm@x',
          role: 'agent',
          created_at: created,
        },
      ]);
      auditService.aggregateTeamKpis.mockResolvedValue(
        new Map([
          [
            1,
            {
              reportsStatusUpdated: 2,
              reportMessagesSent: 3,
              contactReplies: 1,
              contactClosed: 1,
            },
          ],
        ]),
      );
      reportRepo.query.mockResolvedValue([{ user_id: '1', count: '2' }]);

      const result = await service.getTeamKpis('c1', 30);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: 1,
        reportsHandled: 5,
        reportsResolved: 2,
        resolutionRate: 40,
        messagesSent: 3,
      });
    });
  });

  describe('getTeamActivity', () => {
    it('maps audit logs with user names', async () => {
      auditService.findByTenant.mockResolvedValue([
        {
          id: 1,
          userId: 7,
          action: 'report.created',
          resourceType: 'report',
          resourceId: 9,
          metadata: {},
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ]);
      userRepo.find.mockResolvedValue([{ id: 7, name: 'Ada', surname: 'L' }]);
      const result = await service.getTeamActivity('c1', 10);
      expect(result[0]).toMatchObject({
        userName: 'Ada L',
        action: 'report.created',
      });
    });
  });
});
