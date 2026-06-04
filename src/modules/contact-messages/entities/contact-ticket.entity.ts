import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ContactTicketMessage } from './contact-ticket-message.entity';

@Entity('contact_tickets')
export class ContactTicket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Index()
  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ length: 255 })
  subject!: string;

  @Column({ default: 'En attente' })
  status!: string;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt?: Date;

  @Column({ name: 'closed_by_user_id', nullable: true })
  closedByUserId?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ContactTicketMessage, (message) => message.ticket)
  messages?: ContactTicketMessage[];
}
