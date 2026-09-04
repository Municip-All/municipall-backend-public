import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CitizenFeedback } from './entities/citizen-feedback.entity';
import { Report } from '../reports/entities/report.entity';
import { ContactTicket } from '../contact-messages/entities/contact-ticket.entity';
import { User } from '../user/user.entity';

describe('FeedbackService', () => {
  let service: FeedbackService;

  const feedbackRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const reportRepo = {
    findOne: jest.fn(),
  };
  const ticketRepo = {
    findOne: jest.fn(),
  };
  const userRepo = {
    find: jest.fn(),
  };

  const createdAt = new Date('2026-03-01T10:00:00.000Z');

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getRepositoryToken(CitizenFeedback), useValue: feedbackRepo },
        { provide: getRepositoryToken(Report), useValue: reportRepo },
        { provide: getRepositoryToken(ContactTicket), useValue: ticketRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();
    service = module.get(FeedbackService);
  });

  describe('findUserRating', () => {
    it('returns undefined when no rating', async () => {
      feedbackRepo.findOne.mockResolvedValue(null);
      await expect(service.findUserRating('city-1', 1, 'report', 10)).resolves.toBeUndefined();
    });

    it('returns rating view', async () => {
      feedbackRepo.findOne.mockResolvedValue({
        stars: 4,
        message: 'ok',
        createdAt,
      });
      await expect(service.findUserRating('city-1', 1, 'report', 10)).resolves.toEqual({
        stars: 4,
        message: 'ok',
        createdAt: createdAt.toISOString(),
      });
    });
  });

  describe('submit', () => {
    it('throws NotFound when report missing', async () => {
      reportRepo.findOne.mockResolvedValue(null);
      await expect(
        service.submit('city-1', 1, { resourceType: 'report', resourceId: 9, stars: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden when report belongs to another user', async () => {
      reportRepo.findOne.mockResolvedValue({ id: 9, userId: 2, status: 'Résolu' });
      await expect(
        service.submit('city-1', 1, { resourceType: 'report', resourceId: 9, stars: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequest when report not terminal', async () => {
      reportRepo.findOne.mockResolvedValue({ id: 9, userId: 1, status: 'En cours' });
      await expect(
        service.submit('city-1', 1, { resourceType: 'report', resourceId: 9, stars: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws Conflict when already rated', async () => {
      reportRepo.findOne.mockResolvedValue({ id: 9, userId: 1, status: 'Résolu' });
      feedbackRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(
        service.submit('city-1', 1, { resourceType: 'report', resourceId: 9, stars: 5 }),
      ).rejects.toThrow(ConflictException);
    });

    it('saves report feedback', async () => {
      reportRepo.findOne.mockResolvedValue({ id: 9, userId: 1, status: 'Clôturé' });
      feedbackRepo.findOne.mockResolvedValue(null);
      const saved = { stars: 5, message: 'super', createdAt };
      feedbackRepo.create.mockReturnValue(saved);
      feedbackRepo.save.mockResolvedValue(saved);

      await expect(
        service.submit('city-1', 1, {
          resourceType: 'report',
          resourceId: 9,
          stars: 5,
          message: '  super  ',
        }),
      ).resolves.toEqual({
        stars: 5,
        message: 'super',
        createdAt: createdAt.toISOString(),
      });
    });

    it('validates contact ticket and saves', async () => {
      ticketRepo.findOne.mockResolvedValue({
        id: 3,
        userId: 1,
        ticketType: 'question',
        status: 'Clôturé',
      });
      feedbackRepo.findOne.mockResolvedValue(null);
      const saved = { stars: 3, message: undefined, createdAt };
      feedbackRepo.create.mockReturnValue(saved);
      feedbackRepo.save.mockResolvedValue(saved);

      await expect(
        service.submit('city-1', 1, {
          resourceType: 'contact_ticket',
          resourceId: 3,
          stars: 3,
        }),
      ).resolves.toMatchObject({ stars: 3 });
    });

    it('throws when contact ticket not terminal', async () => {
      ticketRepo.findOne.mockResolvedValue({
        id: 3,
        userId: 1,
        ticketType: 'question',
        status: 'En cours',
      });
      await expect(
        service.submit('city-1', 1, {
          resourceType: 'contact_ticket',
          resourceId: 3,
          stars: 3,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listForMayor', () => {
    it('returns empty when no feedback', async () => {
      feedbackRepo.find.mockResolvedValue([]);
      await expect(service.listForMayor('city-1')).resolves.toEqual([]);
      expect(userRepo.find).not.toHaveBeenCalled();
    });

    it('maps rows with labels and citizen names', async () => {
      feedbackRepo.find.mockResolvedValue([
        {
          id: 1,
          stars: 4,
          message: 'm',
          resourceType: 'report',
          resourceId: 10,
          userId: 7,
          createdAt,
        },
        {
          id: 2,
          stars: 5,
          resourceType: 'contact_ticket',
          resourceId: 20,
          userId: 8,
          createdAt,
        },
      ]);
      userRepo.find.mockResolvedValue([
        { id: 7, name: 'Alice', surname: 'A', email: 'a@x' },
        { id: 8, name: '', surname: '', email: 'b@x' },
      ]);
      reportRepo.findOne.mockResolvedValue({ category: 'Voirie', description: 'Nid' });
      ticketRepo.findOne.mockResolvedValue({ subject: 'Aide', ticketType: 'question' });

      const result = await service.listForMayor('city-1', 10);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        resourceLabel: 'Nid',
        citizenName: 'Alice A',
      });
      expect(result[1]).toMatchObject({
        resourceLabel: 'Question · Aide',
        citizenName: 'b@x',
      });
    });
  });

  describe('getSatisfactionSummary', () => {
    it('returns empty summary when no rows', async () => {
      feedbackRepo.find.mockResolvedValue([]);
      const result = await service.getSatisfactionSummary('city-1');
      expect(result.satisfaction).toBe(0);
      expect(result.ratingsCount).toBe(0);
      expect(result.trendData).toHaveLength(7);
    });

    it('computes satisfaction from recent ratings', async () => {
      const now = new Date();
      feedbackRepo.find.mockResolvedValue([
        { stars: 5, createdAt: now },
        { stars: 3, createdAt: now },
      ]);
      const result = await service.getSatisfactionSummary('city-1');
      expect(result.ratingsCount).toBe(2);
      expect(result.satisfaction).toBe(80);
      expect(result.trendData).toHaveLength(7);
    });
  });
});
