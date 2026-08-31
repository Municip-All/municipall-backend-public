import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, Unique } from 'typeorm';

export type FeedbackResourceType = 'report' | 'contact_ticket';

@Entity('citizen_feedback')
@Unique('uq_citizen_feedback_resource_user', ['tenantId', 'resourceType', 'resourceId', 'userId'])
export class CitizenFeedback {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Index()
  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'resource_type', length: 32 })
  resourceType!: FeedbackResourceType;

  @Column({ name: 'resource_id' })
  resourceId!: number;

  @Column({ type: 'smallint' })
  stars!: number;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
