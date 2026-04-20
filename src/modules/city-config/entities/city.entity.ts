import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('cities')
export class City {
  @PrimaryColumn()
  id!: string; // Using string as it acts as tenantId (e.g., 'paris', 'lyon')

  @Column()
  name!: string;

  @Column({ name: 'primary_color' })
  primaryColor!: string;

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
}
