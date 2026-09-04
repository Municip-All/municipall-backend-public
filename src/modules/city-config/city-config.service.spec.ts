import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CityConfigService } from './city-config.service';
import { City } from './entities/city.entity';
import { Report } from '../reports/entities/report.entity';
import { User } from '../user/user.entity';
import { ContactTicketsService } from '../contact-messages/contact-tickets.service';
import { AuditService } from '../audit/audit.service';
import { FeedbackService } from '../feedback/feedback.service';

describe('CityConfigService', () => {
  let service: CityConfigService;

  const cityRepo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    findOneByOrFail: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    query: jest.fn(),
  };
  const reportRepo = {
    find: jest.fn(),
    count: jest.fn(),
  };
  const userRepo = {
    count: jest.fn(),
  };
  const contactTicketsService = {
    findPendingForTenant: jest.fn(),
    findLastMessageBodiesForTickets: jest.fn(),
    isUrgentTicket: jest.fn(),
  };
  const auditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };
  const feedbackService = {
    getSatisfactionSummary: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    cityRepo.count.mockResolvedValue(1);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CityConfigService,
        { provide: getRepositoryToken(City), useValue: cityRepo },
        { provide: getRepositoryToken(Report), useValue: reportRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: ContactTicketsService, useValue: contactTicketsService },
        { provide: AuditService, useValue: auditService },
        { provide: FeedbackService, useValue: feedbackService },
      ],
    }).compile();
    service = module.get(CityConfigService);
  });

  describe('findAllActive', () => {
    it('maps cities with official names', async () => {
      cityRepo.find.mockResolvedValue([
        { id: 'city-1', name: 'App', officialName: 'Ville Officielle', logoUrl: 'l.png' },
        { id: 'le-kremlin-bicetre', name: 'KB', officialName: null, logoUrl: undefined },
      ]);
      const result = await service.findAllActive();
      expect(result[0]).toEqual({
        id: 'city-1',
        name: 'App',
        officialName: 'Ville Officielle',
        logoUrl: 'l.png',
      });
      expect(result[1].officialName).toBe('Le Kremlin-Bicêtre');
    });
  });

  describe('getCityConfig', () => {
    it('returns default when city missing', async () => {
      cityRepo.findOneBy.mockResolvedValue(null);
      const result = await service.getCityConfig('missing');
      expect(result.name).toBe("Municip'All");
      expect(result.features).toEqual([]);
    });

    it('maps city entity fields', async () => {
      cityRepo.findOneBy.mockResolvedValue({
        id: 'city-1',
        name: 'Ville',
        officialName: 'Ville Off',
        features: ['reports'],
        dataRetentionPolicy: '1 an',
        contactEmail: 'c@x',
        contactPhone: '01',
        contactHelpText: 'help',
        primaryColor: '#000',
        secondaryColor: '#111',
        useGradient: true,
        logoUrl: 'logo',
        neighborhoods: [],
        usefulNumbers: [],
        usefulLinks: [],
        wasteConfig: { services: [] },
        isTransportFeatureAllowed: true,
        isTransportFeatureEnabled: true,
        associations: [],
        publicProfile: { mayorName: 'M' },
      });
      const result = await service.getCityConfig('city-1');
      expect(result).toMatchObject({
        name: 'Ville',
        officialName: 'Ville Off',
        features: ['reports'],
        contact: { email: 'c@x', phone: '01', helpText: 'help' },
        isTransportFeatureAllowed: true,
        isTransportFeatureEnabled: true,
      });
    });
  });

  describe('getCityEntity / assertTransportAccess / isFeatureEnabled', () => {
    it('getCityEntity throws NotFound', async () => {
      cityRepo.findOneBy.mockResolvedValue(null);
      await expect(service.getCityEntity('x')).rejects.toThrow(NotFoundException);
    });

    it('assertTransportAccess throws when disabled', async () => {
      cityRepo.findOneBy.mockResolvedValue({
        id: 'city-1',
        isTransportFeatureAllowed: false,
        isTransportFeatureEnabled: false,
      });
      await expect(service.assertTransportAccess('city-1')).rejects.toThrow(ForbiddenException);
    });

    it('assertTransportAccess returns city when enabled', async () => {
      const city = {
        id: 'city-1',
        isTransportFeatureAllowed: true,
        isTransportFeatureEnabled: true,
      };
      cityRepo.findOneBy.mockResolvedValue(city);
      await expect(service.assertTransportAccess('city-1')).resolves.toEqual(city);
    });

    it('isFeatureEnabled checks features list', async () => {
      cityRepo.findOneBy.mockResolvedValue({
        id: 'city-1',
        name: 'V',
        features: ['weather'],
        primaryColor: '#000',
        useGradient: false,
      });
      await expect(service.isFeatureEnabled('city-1', 'weather')).resolves.toBe(true);
      await expect(service.isFeatureEnabled('city-1', 'reports')).resolves.toBe(false);
    });
  });

  describe('findByLocation', () => {
    it('queries ST_Contains', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 'c1' }),
      };
      cityRepo.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findByLocation(48.8, 2.3)).resolves.toEqual({ id: 'c1' });
      expect(qb.where).toHaveBeenCalled();
    });
  });

  describe('getDashboardStats', () => {
    it('builds stats from mocked deps', async () => {
      userRepo.count.mockResolvedValue(10);
      reportRepo.find.mockResolvedValue([
        {
          id: 1,
          category: 'Voirie',
          status: 'En attente',
          description: 'Nid',
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-01T00:00:00.000Z'),
        },
      ]);
      reportRepo.count.mockResolvedValue(2);
      contactTicketsService.findPendingForTenant.mockResolvedValue([
        {
          id: 7,
          subject: 'Aide',
          ticketType: 'question',
          status: 'En attente',
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          updatedAt: new Date('2026-03-01T00:00:00.000Z'),
        },
      ]);
      contactTicketsService.findLastMessageBodiesForTickets.mockResolvedValue(
        new Map([[7, 'urgent besoin']]),
      );
      contactTicketsService.isUrgentTicket.mockReturnValue(true);
      feedbackService.getSatisfactionSummary.mockResolvedValue({
        satisfaction: 80,
        satisfactionTrend: 5,
        ratingsCount: 3,
        trendData: [{ name: 'Lun', satisfaction: 80 }],
      });

      const result = await service.getDashboardStats('city-1');
      expect(result.citizensCount).toBe(10);
      expect(result.activeReportsCount).toBe(1);
      expect(result.urgentReportsCount).toBe(1);
      expect(result.satisfaction).toBe(80);
      expect(result.alerts.length).toBeGreaterThan(0);
      expect(result.urgentAlertsCount).toBeGreaterThan(0);
    });

    it('wraps unexpected errors', async () => {
      userRepo.count.mockRejectedValue(new Error('boom'));
      await expect(service.getDashboardStats('city-1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateCityConfig', () => {
    it('throws when city missing', async () => {
      cityRepo.findOneBy.mockResolvedValue(null);
      await expect(service.updateCityConfig('x', { name: 'N' })).rejects.toThrow(NotFoundException);
    });

    it('updates allowed fields and audits', async () => {
      const city = {
        id: 'city-1',
        name: 'Old',
        isTransportFeatureAllowed: true,
        isTransportFeatureEnabled: false,
      };
      cityRepo.findOneBy.mockResolvedValue(city);
      cityRepo.update.mockResolvedValue(undefined);
      const updated = { ...city, name: 'New', features: ['reports'] };
      cityRepo.findOneByOrFail.mockResolvedValue(updated);

      const result = await service.updateCityConfig(
        'city-1',
        { name: 'New', features: ['reports'], primaryColor: '#fff' },
        9,
      );
      expect(cityRepo.update).toHaveBeenCalledWith(
        'city-1',
        expect.objectContaining({ name: 'New', features: ['reports'], primaryColor: '#fff' }),
      );
      expect(auditService.log).toHaveBeenCalled();
      expect(result.name).toBe('New');
    });

    it('forbids enabling transport when not contracted', async () => {
      cityRepo.findOneBy.mockResolvedValue({
        id: 'city-1',
        isTransportFeatureAllowed: false,
        isTransportFeatureEnabled: false,
      });
      await expect(
        service.updateCityConfig('city-1', { isTransportFeatureEnabled: true }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
