import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

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

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // PostGIS geometry for report location
  @Index({ spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
