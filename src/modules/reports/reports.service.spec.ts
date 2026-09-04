import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';
import { ReportMessage } from './entities/report-message.entity';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';
import { AuditService } from '../audit/audit.service';
import { FeedbackService } from '../feedback/feedback.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockReportRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findOneByOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 1 }] }),
    }),
    manager: {
      findOne: jest.fn(),
      increment: jest.fn(),
    },
  };

  const mockMessageRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockCityRepo = {
    findOne: jest.fn(),
  };

  const mockAuditService = { log: jest.fn().mockResolvedValue(undefined) };
  const mockFeedbackService = { findUserRating: jest.fn().mockResolvedValue(undefined) };
  const mockNotificationsService = {
    sendPushNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Report), useValue: mockReportRepo },
        { provide: getRepositoryToken(ReportMessage), useValue: mockMessageRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(City), useValue: mockCityRepo },
        { provide: AuditService, useValue: mockAuditService },
        { provide: FeedbackService, useValue: mockFeedbackService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        {
          provide: AiEngineService,
          useValue: {},
        },
        {
          provide: 'BullQueue_ai-enrichment',
          useValue: { add: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('create', () => {
    it('should throw BadRequestException when lat/lon are not finite', async () => {
      const dto = { category: 'Voirie', lat: NaN, lon: 2.35 } as unknown as CreateReportDto;
      await expect(service.create('city-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should create a report and return it', async () => {
      const dto: CreateReportDto = {
        category: 'Voirie',
        description: 'test',
        lat: 48.85,
        lon: 2.35,
      };
      const savedReport = {
        id: 1,
        tenantId: 'city-1',
        ...dto,
        status: 'En attente',
        isResident: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const values = jest.fn().mockReturnThis();
      mockReportRepo.createQueryBuilder.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values,
        returning: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 1 }] }),
      });

      mockReportRepo.findOneByOrFail.mockResolvedValue(savedReport);

      const result = await service.create('city-1', dto);
      expect(result).toEqual(savedReport);
      type InsertedValues = { lat: number; lon: number; location: () => string };
      const calls = values.mock.calls as [InsertedValues][];
      const inserted = calls[0]?.[0];
      expect(inserted?.lat).toBe(48.85);
      expect(inserted?.lon).toBe(2.35);
      expect(inserted?.location()).toContain('ST_MakePoint(2.35, 48.85)');
    });
  });

  describe('findAll', () => {
    it('should return reports for a tenant', async () => {
      const reports = [{ id: 1, tenantId: 'city-1', category: 'Voirie' }];
      mockReportRepo.find.mockResolvedValue(reports);

      const result = await service.findAll('city-1');
      expect(result).toEqual(reports);
      expect(mockReportRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'city-1' },
        order: { createdAt: 'DESC' },
        select: [
          'id',
          'tenantId',
          'userId',
          'category',
          'status',
          'isResident',
          'imageUrl',
          'description',
          'lat',
          'lon',
          'createdAt',
          'updatedAt',
        ],
      });
    });

    it('should return empty array when no reports', async () => {
      mockReportRepo.find.mockResolvedValue([]);

      const result = await service.findAll('city-1');
      expect(result).toEqual([]);
    });

    it('should rethrow repository errors', async () => {
      mockReportRepo.find.mockRejectedValue(new Error('db'));
      await expect(service.findAll('city-1')).rejects.toThrow('db');
    });
  });

  describe('findByUser', () => {
    it('maps reports to list items with last message', async () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');
      mockReportRepo.find.mockResolvedValue([
        {
          id: 1,
          category: 'Voirie',
          status: 'En cours',
          description: 'd',
          imageUrl: undefined,
          lat: 1,
          lon: 2,
          createdAt,
          updatedAt,
        },
      ]);
      mockMessageRepo.findOne.mockResolvedValue({
        body: 'hello',
        senderRole: 'agent',
        createdAt,
      });

      const result = await service.findByUser('city-1', 9);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        category: 'Voirie',
        lastMessage: { body: 'hello', senderRole: 'agent' },
      });
    });
  });

  describe('findDetail', () => {
    const baseReport = {
      id: 1,
      tenantId: 'city-1',
      userId: 9,
      category: 'Voirie',
      status: 'En cours',
      isResident: true,
      imageUrl: undefined,
      description: 'desc',
      lat: 48.8,
      lon: 2.3,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    it('throws NotFound when missing', async () => {
      mockReportRepo.findOne.mockResolvedValue(null);
      await expect(service.findDetail('city-1', 1, 9, 'citizen')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws Forbidden for another citizen', async () => {
      mockReportRepo.findOne.mockResolvedValue(baseReport);
      await expect(service.findDetail('city-1', 1, 99, 'citizen')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns detail with citizen and rating for owner', async () => {
      mockReportRepo.findOne.mockResolvedValue(baseReport);
      mockMessageRepo.find.mockResolvedValue([]);
      mockUserRepo.findOne.mockResolvedValue({
        id: 9,
        name: 'A',
        surname: 'B',
        email: 'a@b.c',
        cityId: 'city-1',
      });
      mockCityRepo.findOne.mockResolvedValue({ name: 'Ville' });
      mockFeedbackService.findUserRating.mockResolvedValue({
        stars: 4,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      const result = await service.findDetail('city-1', 1, 9, 'citizen');
      expect(result.citizen).toMatchObject({ name: 'A', cityName: 'Ville' });
      expect(result.userRating).toMatchObject({ stars: 4 });
      expect(result.messages).toEqual([]);
    });
  });

  describe('addMessage', () => {
    it('throws when sender missing', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      await expect(service.addMessage('city-1', 1, 9, 'hi')).rejects.toThrow(ForbiddenException);
    });

    it('throws when report closed', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 9, role: 'citizen', cityId: 'city-1' });
      mockReportRepo.findOneBy.mockResolvedValue({
        id: 1,
        userId: 9,
        status: 'Clôturé',
        tenantId: 'city-1',
      });
      await expect(service.addMessage('city-1', 1, 9, 'hi', 'citizen')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws on empty body', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 9, role: 'citizen', cityId: 'city-1' });
      mockReportRepo.findOneBy.mockResolvedValue({
        id: 1,
        userId: 9,
        status: 'En cours',
        tenantId: 'city-1',
      });
      await expect(service.addMessage('city-1', 1, 9, '   ', 'citizen')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('saves message and returns detail', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce({ id: 2, role: 'agent', cityId: 'city-1' })
        .mockResolvedValueOnce({ id: 2, name: 'Ag', surname: 'Ent', email: 'a@x' })
        .mockResolvedValueOnce({
          id: 9,
          name: 'Cit',
          surname: 'Zen',
          email: 'c@x',
          cityId: 'city-1',
        });
      mockReportRepo.findOneBy.mockResolvedValue({
        id: 1,
        userId: 9,
        status: 'En attente',
        tenantId: 'city-1',
      });
      mockMessageRepo.create.mockImplementation((d: Partial<ReportMessage>) => d);
      mockMessageRepo.save.mockResolvedValue({});
      mockReportRepo.save.mockResolvedValue({});
      mockReportRepo.findOne.mockResolvedValue({
        id: 1,
        tenantId: 'city-1',
        userId: 9,
        category: 'Voirie',
        status: 'En cours',
        isResident: true,
        lat: 1,
        lon: 2,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      });
      mockMessageRepo.find.mockResolvedValue([
        {
          id: 10,
          senderId: 2,
          senderRole: 'agent',
          body: 'Réponse',
          createdAt: new Date('2026-01-03T00:00:00.000Z'),
        },
      ]);
      mockCityRepo.findOne.mockResolvedValue({ name: 'Ville' });
      mockNotificationsService.sendPushNotification.mockResolvedValue(undefined);

      const result = await service.addMessage('city-1', 1, 2, 'Réponse', 'agent');
      expect(mockMessageRepo.save).toHaveBeenCalled();
      expect(mockReportRepo.save).toHaveBeenCalled();
      expect(result.messages).toHaveLength(1);
      expect(mockNotificationsService.sendPushNotification).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('throws when report missing', async () => {
      mockReportRepo.findOneBy.mockResolvedValue(null);
      await expect(service.updateStatus(1, 'Résolu', 'city-1', 2)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('updates status and audits', async () => {
      const report = { id: 1, status: 'En cours', tenantId: 'city-1' };
      mockReportRepo.findOneBy.mockResolvedValue(report);
      mockReportRepo.save.mockImplementation((r: Report) => Promise.resolve(r));

      const result = await service.updateStatus(1, 'Résolu', 'city-1', 2);
      expect(result.status).toBe('Résolu');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'report.status_updated' }),
      );
    });
  });

  describe('getClusteredReports', () => {
    it('returns empty array', async () => {
      await expect(service.getClusteredReports({})).resolves.toEqual([]);
    });
  });
});
