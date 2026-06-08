import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Index()
  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ length: 64 })
  action!: string;

  @Column({ name: 'resource_type', length: 64 })
  resourceType!: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId?: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
