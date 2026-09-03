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
import { BadRequestException } from '@nestjs/common';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Report), useValue: mockReportRepo },
        { provide: getRepositoryToken(ReportMessage), useValue: mockMessageRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(City), useValue: mockCityRepo },
        {
          provide: AuditService,
          useValue: { log: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: FeedbackService,
          useValue: { findUserRating: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: NotificationsService,
          useValue: { sendPushNotification: jest.fn().mockResolvedValue(undefined) },
        },
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

      mockReportRepo.createQueryBuilder.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 1 }] }),
      });

      mockReportRepo.findOneByOrFail.mockResolvedValue(savedReport);

      const result = await service.create('city-1', dto);
      expect(result).toEqual(savedReport);
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
  });
});
