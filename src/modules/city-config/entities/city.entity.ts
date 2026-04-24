import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('cities')
export class City {
  @PrimaryColumn()
  id!: string; // Using string as it acts as tenantId (e.g., 'paris', 'lyon')

  @Column()
  name!: string;

  @Column({ name: 'primary_color' })
  primaryColor!: string;

  @Column({ name: 'secondary_color', nullable: true })
  secondaryColor?: string;

  @Column({ name: 'use_gradient', default: false })
  useGradient!: boolean;

  @Column({ name: 'logo_url' })
  logoUrl!: string;

  @Column('simple-array')
  features!: string[];

  // PostGIS geometry for city boundary
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  boundary?: any;

  @Column('simple-array', { nullable: true })
  neighborhoods?: string[];

  @Column('simple-json', { name: 'useful_numbers', nullable: true })
  usefulNumbers?: { label: string; phone: string; icon: string }[];

  @Column('simple-json', { name: 'useful_links', nullable: true })
  usefulLinks?: { label: string; url: string; icon: string }[];
}
