import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        name character varying NOT NULL,
        surname character varying,
        role character varying NOT NULL,
        email character varying NOT NULL,
        avatar_url character varying,
        password character varying NOT NULL,
        "cityId" character varying,
        points integer NOT NULL DEFAULT 0,
        neighborhood character varying,
        expo_push_token character varying,
        preferences jsonb,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        update_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_user_cityId ON "user" ("cityId")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        "tenantId" character varying(64) NOT NULL,
        "userId" integer,
        category character varying(128) NOT NULL,
        status character varying(64) NOT NULL DEFAULT 'En attente',
        "isResident" boolean NOT NULL DEFAULT true,
        "imageUrl" text,
        description text,
        "sentimentScore" real,
        "aiConfidence" real,
        "isSpam" boolean NOT NULL DEFAULT false,
        "duplicateOfId" integer,
        "municipalService" character varying(160),
        "aiCategory" character varying(128),
        "aiProcessed" boolean NOT NULL DEFAULT false,
        embedding vector(384),
        location geometry(Point, 4326),
        lat double precision NOT NULL DEFAULT 0,
        lon double precision NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_reports_tenantId ON reports ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_reports_userId ON reports ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_reports_status ON reports (status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_reports_createdAt ON reports ("createdAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_reports_category ON reports (category)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_reports_embedding_hnsw ON reports USING hnsw (embedding vector_cosine_ops)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS report_messages (
        id SERIAL PRIMARY KEY,
        "reportId" integer NOT NULL,
        "senderId" integer NOT NULL,
        "senderRole" character varying NOT NULL DEFAULT 'citizen',
        body text NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id character varying PRIMARY KEY,
        name character varying NOT NULL,
        "officialName" character varying,
        "primaryColor" character varying,
        "secondaryColor" character varying,
        "useGradient" boolean DEFAULT false,
        "logoUrl" character varying,
        features text[],
        neighborhoods jsonb,
        boundary geometry(MultiPolygon, 4326),
        "dataRetentionPolicy" character varying,
        "contactEmail" character varying,
        "contactPhone" character varying,
        "contactHelpText" character varying
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS invitation (
        id SERIAL PRIMARY KEY,
        email character varying NOT NULL,
        name character varying,
        "cityId" character varying NOT NULL,
        role character varying DEFAULT 'assistant',
        "invitedById" integer,
        status character varying DEFAULT 'pending',
        token character varying NOT NULL,
        "expiresAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        "tenantId" character varying NOT NULL,
        "userId" integer NOT NULL,
        action character varying NOT NULL,
        "resourceType" character varying,
        "resourceId" integer,
        metadata jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        "tenantId" character varying(64) NOT NULL,
        title character varying NOT NULL,
        description text,
        "startDate" timestamptz NOT NULL,
        "endDate" timestamptz,
        location character varying,
        category character varying,
        "imageUrl" character varying,
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS construction_works (
        id SERIAL PRIMARY KEY,
        "tenantId" character varying(64) NOT NULL,
        title character varying NOT NULL,
        description text,
        "startDate" date NOT NULL,
        "endDate" date,
        location character varying,
        category character varying,
        status character varying DEFAULT 'planned',
        location_point geometry(Point, 4326),
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_tickets (
        id SERIAL PRIMARY KEY,
        "tenantId" character varying(64) NOT NULL,
        "userId" integer,
        subject character varying NOT NULL,
        status character varying DEFAULT 'open',
        category character varying,
        "createdAt" timestamptz NOT NULL DEFAULT NOW(),
        "updatedAt" timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_ticket_messages (
        id SERIAL PRIMARY KEY,
        "ticketId" integer NOT NULL,
        "senderId" integer NOT NULL,
        "senderRole" character varying NOT NULL DEFAULT 'citizen',
        body text NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS contact_ticket_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS contact_tickets`);
    await queryRunner.query(`DROP TABLE IF EXISTS construction_works`);
    await queryRunner.query(`DROP TABLE IF EXISTS events`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS invitation`);
    await queryRunner.query(`DROP TABLE IF EXISTS cities`);
    await queryRunner.query(`DROP TABLE IF EXISTS report_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS reports`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
  }
}
