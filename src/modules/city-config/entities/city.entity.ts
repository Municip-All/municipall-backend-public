import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('cities')
export class City {
  @PrimaryColumn()
  id!: string; // Using string as it acts as tenantId (e.g., 'paris', 'lyon')

  @Column()
  name!: string;

  /** Nom officiel INSEE / géographique (ex. Le Kremlin-Bicêtre) — distinct du nom d'app marque blanche */
  @Column({ name: 'official_name', nullable: true })
  officialName?: string;

  @Column({ name: 'primary_color' })
  primaryColor!: string;

  @Column({ name: 'secondary_color', nullable: true })
  secondaryColor?: string;

  @Column({ name: 'use_gradient', default: false })
  useGradient!: boolean;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail?: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone?: string;

  @Column({ name: 'contact_help_text', nullable: true })
  contactHelpText?: string;

  /** Durées de conservation RGPD spécifiques au contrat avec la commune (affichées dans l'app) */
  @Column({ name: 'data_retention_policy', type: 'text', nullable: true })
  dataRetentionPolicy?: string;

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

  @Column('simple-json', { nullable: true })
  neighborhoods?: { id: string; name: string; points: [number, number][] }[];

  @Column('simple-json', { name: 'useful_numbers', nullable: true })
  usefulNumbers?: { label: string; phone: string; icon: string }[];

  @Column('simple-json', { name: 'useful_links', nullable: true })
  usefulLinks?: { label: string; url: string; icon: string }[];

  @Column('simple-json', { name: 'waste_config', nullable: true })
  wasteConfig?: {
    services: {
      type: string;
      icon: string;
      color: string;
      days: number[]; // 0=Sunday, 1=Monday...
      time: string; // "HH:mm"
    }[];
  };
}
