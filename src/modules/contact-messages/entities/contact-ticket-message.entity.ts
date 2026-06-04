import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ContactTicket } from './contact-ticket.entity';

export type TicketMessageRole = 'citizen' | 'agent';

@Entity('contact_ticket_messages')
export class ContactTicketMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ name: 'ticket_id' })
  ticketId!: number;

  @Column({ name: 'sender_id' })
  senderId!: number;

  @Column({ name: 'sender_role', length: 16 })
  senderRole!: TicketMessageRole;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => ContactTicket, (ticket) => ticket.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket?: ContactTicket;
}
