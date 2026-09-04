import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ContactTicketsService } from './contact-tickets.service';
import { ContactTicket } from './entities/contact-ticket.entity';
import { ContactTicketMessage } from './entities/contact-ticket-message.entity';
import { ContactMessage } from './entities/contact-message.entity';
import { User } from '../user/user.entity';
import { FeedbackService } from '../feedback/feedback.service';

describe('ContactTicketsService', () => {
  let service: ContactTicketsService;

  const ticketRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };
  const messageRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    query: jest.fn(),
  };
  const legacyRepo = {
    find: jest.fn(),
  };
  const userRepo = {
    findOne: jest.fn(),
  };
  const feedbackService = {
    findUserRating: jest.fn(),
  };

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-02T00:00:00.000Z');

  beforeEach(async () => {
    jest.clearAllMocks();
    ticketRepo.count.mockResolvedValue(1);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactTicketsService,
        { provide: getRepositoryToken(ContactTicket), useValue: ticketRepo },
        { provide: getRepositoryToken(ContactTicketMessage), useValue: messageRepo },
        { provide: getRepositoryToken(ContactMessage), useValue: legacyRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: FeedbackService, useValue: feedbackService },
      ],
    }).compile();
    service = module.get(ContactTicketsService);
  });

  describe('isUrgentTicket', () => {
    it('detects urgent keywords', () => {
      expect(
        service.isUrgentTicket({ subject: 'Besoin urgent', ticketType: 'question' } as never),
      ).toBe(true);
      expect(
        service.isUrgentTicket({ subject: 'Info', ticketType: 'question' } as never, 'danger ici'),
      ).toBe(true);
      expect(
        service.isUrgentTicket({ subject: 'Question simple', ticketType: 'question' } as never),
      ).toBe(false);
    });
  });

  describe('create', () => {
    it('creates ticket and initial message then returns detail', async () => {
      const ticket = {
        id: 5,
        tenantId: 'city-1',
        userId: 9,
        subject: 'Aide',
        ticketType: 'question',
        status: 'En attente',
        createdAt,
        updatedAt,
      };
      ticketRepo.create.mockReturnValue(ticket);
      ticketRepo.save.mockResolvedValue(ticket);
      messageRepo.create.mockImplementation((d: Partial<ContactTicketMessage>) => d);
      messageRepo.save.mockResolvedValue({});
      ticketRepo.findOne.mockResolvedValue(ticket);
      messageRepo.find.mockResolvedValue([
        {
          id: 1,
          senderId: 9,
          senderRole: 'citizen',
          body: 'Bonjour',
          createdAt,
        },
      ]);
      userRepo.findOne.mockResolvedValue({
        id: 9,
        name: 'A',
        surname: 'B',
        email: 'a@b.c',
      });
      feedbackService.findUserRating.mockResolvedValue(undefined);

      const result = await service.create('city-1', 9, {
        subject: ' Aide ',
        body: ' Bonjour ',
        ticketType: 'question',
      } as never);

      expect(result.id).toBe(5);
      expect(result.messages).toHaveLength(1);
      expect(ticketRepo.save).toHaveBeenCalled();
      expect(messageRepo.save).toHaveBeenCalled();
    });
  });

  describe('findByUser / findAllForTenant', () => {
    it('lists tickets with last messages', async () => {
      const ticket = {
        id: 1,
        subject: 'S',
        ticketType: 'question',
        status: 'En attente',
        createdAt,
        updatedAt,
      };
      ticketRepo.find.mockResolvedValue([ticket]);
      messageRepo.findOne.mockResolvedValue({
        body: 'last',
        senderRole: 'citizen',
        createdAt,
      });

      const mine = await service.findByUser('city-1', 9);
      expect(mine[0].lastMessage?.body).toBe('last');

      const all = await service.findAllForTenant('city-1');
      expect(all).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('throws NotFound', async () => {
      ticketRepo.findOne.mockResolvedValue(null);
      await expect(service.findById(1, 'city-1', 9, 'citizen')).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden for other citizen', async () => {
      ticketRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 9,
        tenantId: 'city-1',
        subject: 'S',
        status: 'En attente',
        createdAt,
        updatedAt,
      });
      await expect(service.findById(1, 'city-1', 2, 'citizen')).rejects.toThrow(ForbiddenException);
    });

    it('returns detail for agent without rating lookup for agent path', async () => {
      ticketRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 9,
        tenantId: 'city-1',
        subject: 'S',
        ticketType: 'question',
        status: 'En cours',
        createdAt,
        updatedAt,
      });
      messageRepo.find.mockResolvedValue([]);
      userRepo.findOne.mockResolvedValue({
        id: 9,
        name: 'A',
        surname: 'B',
        email: 'a@b.c',
      });

      const result = await service.findById(1, 'city-1', 2, 'agent');
      expect(result.citizenName).toBe('A B');
      expect(feedbackService.findUserRating).not.toHaveBeenCalled();
    });
  });

  describe('reply', () => {
    it('throws when closed', async () => {
      ticketRepo.findOne.mockResolvedValue({
        id: 1,
        userId: 9,
        ticketType: 'question',
        status: 'Clôturé',
      });
      await expect(service.reply(1, 'city-1', 2, 'agent', { body: 'x' } as never)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('agent reply updates status from En attente', async () => {
      const ticket = {
        id: 1,
        userId: 9,
        tenantId: 'city-1',
        subject: 'S',
        ticketType: 'question',
        status: 'En attente',
        createdAt,
        updatedAt,
      };
      ticketRepo.findOne
        .mockResolvedValueOnce(ticket)
        .mockResolvedValueOnce({ ...ticket, status: 'En cours' });
      messageRepo.create.mockImplementation((d: Partial<ContactTicketMessage>) => d);
      messageRepo.save.mockResolvedValue({});
      ticketRepo.save.mockResolvedValue(ticket);
      messageRepo.find.mockResolvedValue([]);
      userRepo.findOne.mockResolvedValue({
        id: 9,
        name: 'A',
        surname: 'B',
        email: 'a@b.c',
      });

      await service.reply(1, 'city-1', 2, 'agent', { body: ' Réponse ' } as never);
      expect(ticket.status).toBe('En cours');
      expect(ticketRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateStatus / close', () => {
    it('throws on invalid status', async () => {
      ticketRepo.findOne.mockResolvedValue({
        id: 1,
        tenantId: 'city-1',
        userId: 9,
        ticketType: 'question',
        status: 'En cours',
        createdAt,
        updatedAt,
      });
      await expect(service.updateStatus(1, 'city-1', 2, 'Invalide')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('closes ticket and adds system message', async () => {
      const ticket = {
        id: 1,
        tenantId: 'city-1',
        userId: 9,
        ticketType: 'question',
        status: 'En cours',
        subject: 'S',
        createdAt,
        updatedAt,
      };
      ticketRepo.findOne
        .mockResolvedValueOnce(ticket)
        .mockResolvedValueOnce({ ...ticket, status: 'Clôturé', closedAt: new Date() });
      ticketRepo.save.mockResolvedValue(ticket);
      messageRepo.create.mockImplementation((d: Partial<ContactTicketMessage>) => d);
      messageRepo.save.mockResolvedValue({});
      messageRepo.find.mockResolvedValue([]);
      userRepo.findOne.mockResolvedValue({
        id: 9,
        name: 'A',
        surname: 'B',
        email: 'a@b.c',
      });

      const result = await service.close(1, 'city-1', 2);
      expect(ticket.status).toBe('Clôturé');
      expect(result.status).toBe('Clôturé');
      expect(messageRepo.save).toHaveBeenCalled();
    });

    it('returns detail when already terminal', async () => {
      const ticket = {
        id: 1,
        tenantId: 'city-1',
        userId: 9,
        ticketType: 'question',
        status: 'Clôturé',
        subject: 'S',
        createdAt,
        updatedAt,
        closedAt: createdAt,
      };
      ticketRepo.findOne.mockResolvedValue(ticket);
      messageRepo.find.mockResolvedValue([]);
      userRepo.findOne.mockResolvedValue({
        id: 9,
        name: 'A',
        surname: '',
        email: 'a@b.c',
      });

      const result = await service.updateStatus(1, 'city-1', 2, 'Clôturé');
      expect(result.status).toBe('Clôturé');
      expect(ticketRepo.save).not.toHaveBeenCalled();
    });
  });
});
