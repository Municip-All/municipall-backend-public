import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ReportMessage } from './report-message.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: number;

  @Column()
  category!: string; // 'Voirie', 'Éclairage', 'Propreté', 'Espaces Verts', 'Autre'

  @Column({ default: 'En attente' })
  status!: string; // 'En attente', 'En cours', 'Résolu'

  @Column({ name: 'is_resident', default: true })
  isResident!: boolean;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // --- Champs IA / Pipeline enrichissement ---

  @Column({ name: 'sentiment_score', type: 'float', nullable: true })
  sentimentScore?: number;

  @Column({ name: 'ai_confidence', type: 'float', nullable: true })
  aiConfidence?: number;

  @Column({ name: 'is_spam', default: false })
  isSpam?: boolean;

  @Column({ name: 'duplicate_of_id', nullable: true })
  duplicateOfId?: number;

  @Column({ name: 'municipal_service', nullable: true })
  municipalService?: string;

  @Column({ name: 'ai_category', nullable: true })
  aiCategory?: string;

  @Column({ name: 'ai_processed', default: false })
  aiProcessed?: boolean;

  // NOTE: le champ `embedding` vector(384) est géré EXCLUSIVEMENT par le
  // service IA (pipeline Python/psycopg + pgvector). Il n'est PAS mappé
  // dans TypeORM pour éviter les conflits de type.

  // Position (sans PostGIS – colonnes classiques)
  @Column({ type: 'double precision', nullable: true })
  lat?: number;

  @Column({ type: 'double precision', nullable: true })
  lon?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => ReportMessage, (message) => message.report)
  messages?: ReportMessage[];
}
