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

  /** Fond des écrans de l'app mobile (mode clair) */
  @Column({ name: 'background_color_light', nullable: true })
  backgroundColorLight?: string;

  /** Fond des écrans de l'app mobile (mode sombre) */
  @Column({ name: 'background_color_dark', nullable: true })
  backgroundColorDark?: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail?: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone?: string;

  @Column({ name: 'contact_help_text', nullable: true })
  contactHelpText?: string;

  /** Durées de conservation RGPD spécifiques au contrat avec la commune (affichées dans l'app) */
  @Column({ name: 'data_retention_policy', type: 'text', nullable: true })
  dataRetentionPolicy?: string;

  /** Référence commerciale du contrat plateforme */
  @Column({ name: 'contract_number', nullable: true })
  contractNumber?: string;

  @Column({ name: 'contract_signed_at', type: 'date', nullable: true })
  contractSignedAt?: string;

  @Column({ name: 'contract_notes', type: 'text', nullable: true })
  contractNotes?: string;

  /** Interlocuteur principal côté commune (CRM interne) */
  @Column({ name: 'municipality_contact_name', nullable: true })
  municipalityContactName?: string;

  @Column({ name: 'municipality_contact_role', nullable: true })
  municipalityContactRole?: string;

  @Column({ name: 'municipality_contact_email', nullable: true })
  municipalityContactEmail?: string;

  @Column({ name: 'municipality_contact_phone', nullable: true })
  municipalityContactPhone?: string;

  /** Équipe Municip'All rattachée au dossier */
  @Column({ name: 'assigned_tech_name', nullable: true })
  assignedTechName?: string;

  @Column({ name: 'assigned_tech_email', nullable: true })
  assignedTechEmail?: string;

  @Column({ name: 'sales_rep_name', nullable: true })
  salesRepName?: string;

  @Column({ name: 'sales_rep_email', nullable: true })
  salesRepEmail?: string;

  /** widget | mobile_app | both */
  @Column({ name: 'integration_type', default: 'mobile_app' })
  integrationType!: string;

  @Column('simple-array')
  features!: string[];

  /** Contrat plateforme (WebAdmin) : module transports IDFM autorisé */
  @Column({ name: 'is_transport_feature_allowed', default: false })
  isTransportFeatureAllowed!: boolean;

  /** Activation mairie (Backoffice) : visible dans l'app citoyenne */
  @Column({ name: 'is_transport_feature_enabled', default: false })
  isTransportFeatureEnabled!: boolean;

  // PostGIS geometry for city boundary
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Polygon',
    srid: 4326,
    nullable: true,
  })
  boundary?: object;

  @Column('simple-json', { nullable: true })
  neighborhoods?: { id: string; name: string; points: [number, number][] }[];

  @Column('simple-json', { name: 'useful_numbers', nullable: true })
  usefulNumbers?: { label: string; phone: string; icon: string }[];

  @Column('simple-json', { name: 'useful_links', nullable: true })
  usefulLinks?: { label: string; url: string; icon: string }[];

  @Column('simple-json', { nullable: true })
  associations?: {
    id: string;
    name: string;
    category: 'association' | 'groupe-parole' | 'autre';
    description?: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
  }[];

  @Column('simple-json', { name: 'public_profile', nullable: true })
  publicProfile?: {
    mayorName?: string;
    mayorTitle?: string;
    welcomeText?: string;
    description?: string;
    address?: string;
    website?: string;
    openingHours?: string;
  };

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
