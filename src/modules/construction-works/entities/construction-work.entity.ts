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

  @Column()
  tenantId!: string; // city ID

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  locationName!: string; // e.g. "Avenue de la République"

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  coordinates?: any;

  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp' })
  endDate!: Date;

  @Column({ default: 'Programmé' })
  status!: string; // 'Programmé', 'En cours', 'Terminé', 'Annulé'

  @Column({ nullable: true })
  impactType!: string; // 'Rue barrée', 'Circulation alternée', 'Trottoir réduit', etc.

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
