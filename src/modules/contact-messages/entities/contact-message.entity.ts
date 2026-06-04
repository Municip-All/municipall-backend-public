import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('contact_messages')
export class ContactMessage {
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

  @Column({ type: 'text' })
  body!: string;

  @Column({ default: 'En attente' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
