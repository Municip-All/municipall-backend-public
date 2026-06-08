import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Report } from './report.entity';

export type ReportMessageRole = 'citizen' | 'agent';

@Entity('report_messages')
export class ReportMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ name: 'report_id' })
  reportId!: number;

  @Column({ name: 'sender_id' })
  senderId!: number;

  @Column({ name: 'sender_role', length: 16 })
  senderRole!: ReportMessageRole;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Report, (report) => report.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report?: Report;
}
