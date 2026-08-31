import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('construction_works')
export class ConstructionWork {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'tenantId' })
  tenantId!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'locationName' })
  locationName!: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  coordinates?: unknown;

  @Column({ type: 'timestamp', name: 'startDate' })
  startDate!: Date;

  @Column({ type: 'timestamp', name: 'endDate' })
  endDate!: Date;

  @Column({ default: 'Programmé' })
  status!: string; // 'Programmé', 'En cours', 'Terminé', 'Annulé'

  @Column({ name: 'impactType', nullable: true })
  impactType!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
