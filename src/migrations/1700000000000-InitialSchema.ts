import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        name character varying NOT NULL,
        surname character varying NOT NULL,
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
        tenant_id character varying NOT NULL,
        user_id integer,
        category character varying NOT NULL,
        status character varying NOT NULL DEFAULT 'En attente',
        is_resident boolean NOT NULL DEFAULT true,
        image_url text,
        description text,
        sentiment_score real,
        ai_confidence real,
        is_spam boolean NOT NULL DEFAULT false,
        duplicate_of_id integer,
        municipal_service character varying,
        ai_category character varying,
        ai_processed boolean NOT NULL DEFAULT false,
        lat double precision,
        lon double precision,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_reports_tenant_id ON reports (tenant_id)`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_reports_user_id ON reports (user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_reports_status ON reports (status)`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_reports_created_at ON reports (created_at)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS report_messages (
        id SERIAL PRIMARY KEY,
        report_id integer NOT NULL,
        sender_id integer NOT NULL,
        sender_role character varying(16) NOT NULL,
        body text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_report_messages_report_id ON report_messages (report_id)`,
    );
    await queryRunner.query(
      `ALTER TABLE report_messages ADD CONSTRAINT FK_report_messages_report_id FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id character varying PRIMARY KEY,
        name character varying NOT NULL,
        official_name character varying,
        primary_color character varying NOT NULL,
        secondary_color character varying,
        use_gradient boolean DEFAULT false,
        logo_url character varying,
        background_color_light character varying,
        background_color_dark character varying,
        contact_email character varying,
        contact_phone character varying,
        contact_help_text character varying,
        data_retention_policy text,
        contract_number character varying,
        contract_signed_at date,
        contract_notes text,
        municipality_contact_name character varying,
        municipality_contact_role character varying,
        municipality_contact_email character varying,
        municipality_contact_phone character varying,
        assigned_tech_name character varying,
        assigned_tech_email character varying,
        sales_rep_name character varying,
        sales_rep_email character varying,
        integration_type character varying DEFAULT 'mobile_app',
        features text,
        is_transport_feature_allowed boolean DEFAULT false,
        is_transport_feature_enabled boolean DEFAULT false,
        boundary geometry(Polygon, 4326),
        neighborhoods text,
        useful_numbers text,
        useful_links text,
        associations text,
        public_profile text,
        waste_config text
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        email character varying NOT NULL,
        "cityId" character varying NOT NULL,
        status character varying DEFAULT 'pending',
        token character varying,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        expires_at timestamptz,
        role character varying DEFAULT 'assistant',
        name character varying,
        invited_by_id integer
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_invitations_email ON invitations (email)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_invitations_cityId ON invitations ("cityId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        tenant_id character varying NOT NULL,
        user_id integer NOT NULL,
        action character varying(64) NOT NULL,
        resource_type character varying(64) NOT NULL,
        resource_id integer,
        metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_audit_logs_tenant_id ON audit_logs (tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_audit_logs_user_id ON audit_logs (user_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        city_id character varying NOT NULL,
        title character varying NOT NULL,
        description text NOT NULL,
        location character varying NOT NULL,
        start_date timestamptz NOT NULL,
        end_date timestamptz NOT NULL,
        category character varying NOT NULL,
        image_url character varying,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS construction_works (
        id SERIAL PRIMARY KEY,
        "tenantId" character varying NOT NULL,
        title character varying NOT NULL,
        description text,
        "locationName" character varying NOT NULL,
        coordinates geometry(Point, 4326),
        "startDate" timestamp NOT NULL,
        "endDate" timestamp NOT NULL,
        status character varying DEFAULT 'Programmé',
        "impactType" character varying,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_tickets (
        id SERIAL PRIMARY KEY,
        tenant_id character varying NOT NULL,
        user_id integer NOT NULL,
        subject character varying(255) NOT NULL,
        ticket_type character varying DEFAULT 'question',
        status character varying DEFAULT 'En attente',
        closed_at timestamp,
        closed_by_user_id integer,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_contact_tickets_tenant_id ON contact_tickets (tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_contact_tickets_user_id ON contact_tickets (user_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id integer NOT NULL,
        sender_id integer NOT NULL,
        sender_role character varying(16) NOT NULL,
        body text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_contact_ticket_messages_ticket_id ON contact_ticket_messages (ticket_id)`,
    );
    await queryRunner.query(
      `ALTER TABLE contact_ticket_messages ADD CONSTRAINT FK_contact_ticket_messages_ticket_id FOREIGN KEY (ticket_id) REFERENCES contact_tickets(id) ON DELETE CASCADE`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        tenant_id character varying NOT NULL,
        user_id integer NOT NULL,
        subject character varying(255) NOT NULL,
        body text NOT NULL,
        status character varying DEFAULT 'En attente',
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_contact_messages_tenant_id ON contact_messages (tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_contact_messages_user_id ON contact_messages (user_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS citizen_feedback (
        id SERIAL PRIMARY KEY,
        tenant_id character varying NOT NULL,
        user_id integer NOT NULL,
        resource_type character varying(32) NOT NULL,
        resource_id integer NOT NULL,
        stars smallint NOT NULL,
        message text,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_citizen_feedback_resource_user UNIQUE (tenant_id, resource_type, resource_id, user_id)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_citizen_feedback_tenant_id ON citizen_feedback (tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_citizen_feedback_user_id ON citizen_feedback (user_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS citizen_feedback`);
    await queryRunner.query(`DROP TABLE IF EXISTS contact_ticket_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS contact_tickets`);
    await queryRunner.query(`DROP TABLE IF EXISTS contact_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS construction_works`);
    await queryRunner.query(`DROP TABLE IF EXISTS events`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS invitations`);
    await queryRunner.query(`DROP TABLE IF EXISTS cities`);
    await queryRunner.query(`DROP TABLE IF EXISTS report_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS reports`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
  }
}
