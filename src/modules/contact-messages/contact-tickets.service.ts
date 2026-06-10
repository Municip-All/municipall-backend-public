import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactTicket } from './entities/contact-ticket.entity';
import { ContactTicketMessage, TicketMessageRole } from './entities/contact-ticket-message.entity';
import { ContactMessage } from './entities/contact-message.entity';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { ReplyContactTicketDto } from './dto/reply-contact-ticket.dto';
import { User } from '../user/user.entity';
import { resolveReportSenderRole } from '../../core/auth/roles';
import {
  isAllowedStatus,
  isTerminalContactStatus,
  statusAfterAgentFirstReply,
} from './contact-ticket-status';
import { FeedbackService, UserRatingView } from '../feedback/feedback.service';

const URGENT_KEYWORDS = /urgent|très grave|tres grave|grave|danger|accident/i;
const CLOSED_STATUS = 'Clôturé';

export interface TicketMessageView {
  id: number;
  senderId: number;
  senderRole: TicketMessageRole;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface ContactTicketListItem {
  id: number;
  subject: string;
  ticketType: 'question' | 'suggestion';
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    body: string;
    senderRole: TicketMessageRole;
    createdAt: string;
  };
}

export interface ContactTicketDetail {
  id: number;
  subject: string;
  ticketType: 'question' | 'suggestion';
  status: string;
  userId: number;
  citizenName: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  messages: TicketMessageView[];
  userRating?: UserRatingView;
}

@Injectable()
export class ContactTicketsService implements OnModuleInit {
  constructor(
    @InjectRepository(ContactTicket)
    private readonly ticketRepository: Repository<ContactTicket>,
    @InjectRepository(ContactTicketMessage)
    private readonly messageRepository: Repository<ContactTicketMessage>,
    @InjectRepository(ContactMessage)
    private readonly legacyRepository: Repository<ContactMessage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly feedbackService: FeedbackService,
  ) {}

  async onModuleInit() {
    try {
      const ticketCount = await this.ticketRepository.count();
      if (ticketCount > 0) return;

      const legacy = await this.legacyRepository.find({ order: { createdAt: 'ASC' } });
      for (const row of legacy) {
        const ticket = await this.ticketRepository.save(
          this.ticketRepository.create({
            tenantId: row.tenantId,
            userId: row.userId,
            subject: row.subject,
            status: row.status === 'Résolu' ? CLOSED_STATUS : row.status,
            closedAt: row.status === 'Résolu' ? row.updatedAt : undefined,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          }),
        );
        await this.messageRepository.save(
          this.messageRepository.create({
            ticketId: ticket.id,
            senderId: row.userId,
            senderRole: 'citizen',
            body: row.body,
            createdAt: row.createdAt,
          }),
        );
      }
    } catch {
      // Legacy table may not exist yet
    }
  }

  private async resolveSenderDisplayName(userId: number, role: TicketMessageRole): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['name', 'surname', 'email'],
    });
    if (!user) return role === 'agent' ? 'Mairie' : 'Utilisateur';
    const full = `${user.name || ''} ${user.surname || ''}`.trim();
    const person = full || user.email;
    if (role === 'agent') return `Mairie - ${person}`;
    return person;
  }

  private async mapMessages(messages: ContactTicketMessage[]): Promise<TicketMessageView[]> {
    const names = new Map<string, string>();
    const result: TicketMessageView[] = [];
    for (const msg of messages) {
      const cacheKey = `${msg.senderId}:${msg.senderRole}`;
      if (!names.has(cacheKey)) {
        names.set(cacheKey, await this.resolveSenderDisplayName(msg.senderId, msg.senderRole));
      }
      result.push({
        id: msg.id,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        senderName: names.get(cacheKey) ?? 'Utilisateur',
        body: msg.body,
        createdAt: msg.createdAt.toISOString(),
      });
    }
    return result;
  }

  private async getLastMessage(ticketId: number) {
    return this.messageRepository.findOne({
      where: { ticketId },
      order: { createdAt: 'DESC' },
    });
  }

  private toListItem(
    ticket: ContactTicket,
    last?: ContactTicketMessage | null,
  ): ContactTicketListItem {
    return {
      id: ticket.id,
      subject: ticket.subject,
      ticketType: ticket.ticketType ?? 'question',
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      lastMessage: last
        ? {
            body: last.body,
            senderRole: last.senderRole,
            createdAt: last.createdAt.toISOString(),
          }
        : undefined,
    };
  }

  async create(
    tenantId: string,
    userId: number,
    data: CreateContactMessageDto,
  ): Promise<ContactTicketDetail> {
    const ticketType = data.ticketType === 'suggestion' ? 'suggestion' : 'question';

    const ticket = await this.ticketRepository.save(
      this.ticketRepository.create({
        tenantId,
        userId,
        subject: data.subject.trim(),
        ticketType,
        status: 'En attente',
      }),
    );

    await this.messageRepository.save(
      this.messageRepository.create({
        ticketId: ticket.id,
        senderId: userId,
        senderRole: 'citizen',
        body: data.body.trim(),
      }),
    );

    return this.findById(ticket.id, tenantId, userId, 'citizen');
  }

  async findByUser(tenantId: string, userId: number): Promise<ContactTicketListItem[]> {
    const tickets = await this.ticketRepository.find({
      where: { tenantId, userId },
      order: { updatedAt: 'DESC' },
      take: 50,
    });

    return Promise.all(
      tickets.map(async (ticket) => this.toListItem(ticket, await this.getLastMessage(ticket.id))),
    );
  }

  async findAllForTenant(tenantId: string): Promise<ContactTicketListItem[]> {
    const tickets = await this.ticketRepository.find({
      where: { tenantId },
      order: { updatedAt: 'DESC' },
      take: 100,
    });

    return Promise.all(
      tickets.map(async (ticket) => this.toListItem(ticket, await this.getLastMessage(ticket.id))),
    );
  }

  async findPendingForTenant(tenantId: string): Promise<ContactTicket[]> {
    const tickets = await this.ticketRepository.find({
      where: { tenantId },
      order: { updatedAt: 'DESC' },
      take: 100,
    });
    return tickets.filter((t) => !isTerminalContactStatus(t.ticketType ?? 'question', t.status));
  }

  isUrgentTicket(ticket: ContactTicket, lastBody?: string): boolean {
    const text = `${ticket.subject} ${lastBody ?? ''}`;
    return URGENT_KEYWORDS.test(text);
  }

  async findById(
    id: number,
    tenantId: string,
    userId: number,
    role: string,
  ): Promise<ContactTicketDetail> {
    const ticket = await this.ticketRepository.findOne({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Conversation introuvable');

    const isAgent = resolveReportSenderRole(role) === 'agent';
    if (!isAgent && ticket.userId !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette conversation');
    }

    const messages = await this.messageRepository.find({
      where: { ticketId: id },
      order: { createdAt: 'ASC' },
    });

    const citizenName = await this.resolveSenderDisplayName(ticket.userId, 'citizen');

    let userRating: UserRatingView | undefined;
    if (!isAgent) {
      userRating = await this.feedbackService.findUserRating(
        tenantId,
        userId,
        'contact_ticket',
        ticket.id,
      );
    }

    return {
      id: ticket.id,
      subject: ticket.subject,
      ticketType: ticket.ticketType ?? 'question',
      status: ticket.status,
      userId: ticket.userId,
      citizenName,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      closedAt: ticket.closedAt?.toISOString(),
      messages: await this.mapMessages(messages),
      userRating,
    };
  }

  async reply(
    id: number,
    tenantId: string,
    senderId: number,
    role: string,
    data: ReplyContactTicketDto,
  ): Promise<ContactTicketDetail> {
    const ticket = await this.ticketRepository.findOne({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Conversation introuvable');

    if (isTerminalContactStatus(ticket.ticketType ?? 'question', ticket.status)) {
      throw new BadRequestException('Cette conversation est clôturée');
    }

    const isAgent = resolveReportSenderRole(role) === 'agent';
    if (!isAgent && ticket.userId !== senderId) {
      throw new ForbiddenException('Vous ne pouvez pas répondre à cette conversation');
    }

    const senderRole: TicketMessageRole = isAgent ? 'agent' : 'citizen';

    await this.messageRepository.save(
      this.messageRepository.create({
        ticketId: ticket.id,
        senderId,
        senderRole,
        body: data.body.trim(),
      }),
    );

    if (isAgent && ticket.status === 'En attente') {
      ticket.status = statusAfterAgentFirstReply(ticket.ticketType ?? 'question');
      await this.ticketRepository.save(ticket);
    } else if (!isAgent) {
      ticket.updatedAt = new Date();
      await this.ticketRepository.save(ticket);
    }

    return this.findById(id, tenantId, senderId, role);
  }

  async close(id: number, tenantId: string, agentId: number): Promise<ContactTicketDetail> {
    return this.updateStatus(id, tenantId, agentId, CLOSED_STATUS);
  }

  async updateStatus(
    id: number,
    tenantId: string,
    agentId: number,
    status: string,
  ): Promise<ContactTicketDetail> {
    const ticket = await this.ticketRepository.findOne({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Conversation introuvable');

    const ticketType = ticket.ticketType ?? 'question';
    if (isTerminalContactStatus(ticketType, ticket.status)) {
      return this.findById(id, tenantId, agentId, 'agent');
    }

    if (!isAllowedStatus(ticketType, status)) {
      throw new BadRequestException(`Statut invalide pour ce type de demande: ${status}`);
    }

    if (ticket.status !== status) {
      ticket.status = status;
      if (isTerminalContactStatus(ticketType, status)) {
        ticket.closedAt = new Date();
        ticket.closedByUserId = agentId;
      } else {
        ticket.closedAt = undefined;
        ticket.closedByUserId = undefined;
      }
      await this.ticketRepository.save(ticket);

      const body =
        ticketType === 'suggestion'
          ? `Statut de votre suggestion mis à jour : ${status}.`
          : status === CLOSED_STATUS
            ? '— Conversation clôturée par la mairie. Merci de nous avoir contactés.'
            : `Statut mis à jour : ${status}.`;

      await this.messageRepository.save(
        this.messageRepository.create({
          ticketId: ticket.id,
          senderId: agentId,
          senderRole: 'agent',
          body,
        }),
      );
    }

    return this.findById(id, tenantId, agentId, 'agent');
  }
}
