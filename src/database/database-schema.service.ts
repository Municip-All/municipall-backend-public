import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

/**
 * En prod, TypeORM synchronize est désactivé.
 * Ce service applique uniquement les CREATE TABLE / ADD COLUMN manquants
 * (jamais de DROP) pour aligner la DB prod sur les entités du code déployé.
 */
@Injectable()
export class DatabaseSchemaService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSchemaService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (!this.dataSource.isInitialized) {
      this.logger.warn('DataSource not initialized, skipping schema ensure');
      return;
    }

    await this.ensurePostgis();
    await this.ensurePgvector();
    await this.ensureCityCreatedAt();

    if (!this.shouldEnsureSchema()) {
      return;
    }

    await this.ensureMissingSchema();
    await this.ensureAiColumns();
  }

  private shouldEnsureSchema(): boolean {
    if (this.configService.get<string>('DB_ENSURE_SCHEMA') === 'false') {
      return false;
    }
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      return true;
    }
    return this.configService.get<string>('DB_ENSURE_SCHEMA') === 'true';
  }

  private async ensurePostgis() {
    try {
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS postgis');
    } catch (err) {
      this.logger.warn(
        'PostGIS extension not available (non-fatal)',
        err instanceof Error ? err.message : err,
      );
    }
  }

  private async ensurePgvector() {
    try {
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
    } catch (err) {
      this.logger.warn(
        'pgvector extension not available (non-fatal)',
        err instanceof Error ? err.message : err,
      );
    }
  }

  private async ensureCityCreatedAt() {
    const qRunner = this.dataSource.createQueryRunner();
    try {
      const columns: { column_name: string }[] = (await qRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'cities'`,
      )) as { column_name: string }[];
      if (columns.some((c) => c.column_name === 'created_at')) {
        return;
      }

      this.logger.log('Adding cities.created_at column…');
      await qRunner.query(`
        ALTER TABLE cities
        ADD COLUMN IF NOT EXISTS created_at timestamptz
      `);
      await qRunner.query(`
        UPDATE cities
        SET created_at = contract_signed_at::timestamptz
        WHERE created_at IS NULL AND contract_signed_at IS NOT NULL
      `);
      await qRunner.query(`
        UPDATE cities c
        SET created_at = sub.min_created
        FROM (
          SELECT "cityId", MIN(created_at) AS min_created
          FROM "user"
          WHERE "cityId" IS NOT NULL
          GROUP BY "cityId"
        ) sub
        WHERE c.id = sub."cityId" AND c.created_at IS NULL
      `);
      await qRunner.query(`
        UPDATE cities
        SET created_at = TIMESTAMPTZ '2020-01-01 00:00:00+00'
        WHERE created_at IS NULL
      `);
      await qRunner.query(`
        ALTER TABLE cities
        ALTER COLUMN created_at SET DEFAULT NOW(),
        ALTER COLUMN created_at SET NOT NULL
      `);
      this.logger.log('cities.created_at column ensured');
    } catch (err) {
      this.logger.error(
        'Failed to ensure cities.created_at',
        err instanceof Error ? err.message : err,
      );
    } finally {
      await qRunner.release();
    }
  }

  private async ensureAiColumns() {
    const qRunner = this.dataSource.createQueryRunner();
    try {
      const columns: { column_name: string }[] = (await qRunner.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'reports'`,
      )) as { column_name: string }[];
      const existing = new Set(columns.map((c) => c.column_name));
      const alters: string[] = [];

      if (!existing.has('sentiment_score')) {
        alters.push(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS sentiment_score real`);
      }
      if (!existing.has('ai_confidence')) {
        alters.push(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_confidence real`);
      }
      if (!existing.has('is_spam')) {
        alters.push(
          `ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_spam boolean NOT NULL DEFAULT false`,
        );
      }
      if (!existing.has('duplicate_of_id')) {
        alters.push(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS duplicate_of_id integer`);
      }
      if (!existing.has('municipal_service')) {
        alters.push(
          `ALTER TABLE reports ADD COLUMN IF NOT EXISTS municipal_service character varying`,
        );
      }
      if (!existing.has('ai_category')) {
        alters.push(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_category character varying`);
      }
      if (!existing.has('ai_processed')) {
        alters.push(
          `ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_processed boolean NOT NULL DEFAULT false`,
        );
      }
      if (!existing.has('embedding')) {
        alters.push(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS embedding vector(384)`);
      }
      for (const q of alters) {
        try {
          await qRunner.query(q);
          this.logger.log(`AI column ensured via: ${q.slice(0, 80)}…`);
        } catch (err) {
          if (!this.isBenignSchemaError(err)) {
            this.logger.warn(`AI column ensure skipped: ${q.slice(0, 80)}…`, err);
          }
        }
      }
    } finally {
      await qRunner.release();
    }
  }

  private async ensureMissingSchema() {
    const builder = this.dataSource.driver.createSchemaBuilder();
    const { upQueries } = await builder.log();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    let applied = 0;

    try {
      for (const { query, parameters } of upQueries) {
        const q = query.trim();
        const upper = q.toUpperCase();

        if (upper.startsWith('CREATE TABLE')) {
          const safe = q.replace(/^CREATE TABLE /i, 'CREATE TABLE IF NOT EXISTS ');
          await queryRunner.query(safe, parameters);
          applied++;
          this.logger.log(`Ensured table: ${this.extractTableName(safe)}`);
          continue;
        }

        if (
          upper.startsWith('ALTER TABLE') &&
          upper.includes(' ADD ') &&
          !upper.includes(' DROP ')
        ) {
          try {
            await queryRunner.query(q, parameters);
            applied++;
            this.logger.log(`Ensured column/index on table (ALTER ADD)`);
          } catch (err) {
            if (!this.isBenignSchemaError(err)) {
              this.logger.warn(`ALTER skipped: ${q.slice(0, 120)}…`, err);
            }
          }
          continue;
        }

        if (upper.startsWith('CREATE TYPE')) {
          try {
            await queryRunner.query(q, parameters);
          } catch (err) {
            if (!this.isBenignSchemaError(err)) {
              throw err;
            }
          }
          continue;
        }

        if (upper.startsWith('CREATE INDEX') || upper.startsWith('CREATE UNIQUE INDEX')) {
          if (upper.includes('IF NOT EXISTS')) {
            await queryRunner.query(q, parameters);
          } else {
            const safe = q.replace(/^CREATE (UNIQUE )?INDEX /i, 'CREATE $1INDEX IF NOT EXISTS ');
            try {
              await queryRunner.query(safe, parameters);
            } catch (err) {
              if (!this.isBenignSchemaError(err)) {
                this.logger.warn(`Index skipped: ${q.slice(0, 80)}…`);
              }
            }
          }
        }

        // Ignore DROP / ALTER DROP / RENAME — ne pas toucher aux données prod existantes
      }
    } finally {
      await queryRunner.release();
    }

    this.logger.log(
      applied > 0
        ? `Schema ensure finished (${applied} change(s) applied)`
        : 'Schema ensure finished (database already up to date)',
    );
  }

  private extractTableName(createSql: string): string {
    const match = createSql.match(/CREATE TABLE IF NOT EXISTS "?([^"\s(]+)"?/i);
    return match?.[1] ?? 'unknown';
  }

  private isBenignSchemaError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return (
      msg.includes('already exists') ||
      msg.includes('duplicate') ||
      msg.includes('42701') ||
      msg.includes('42P07')
    );
  }
}
