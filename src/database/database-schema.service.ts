import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * En prod, TypeORM synchronize est désactivé.
 * Ce service applique uniquement les CREATE TABLE / ADD COLUMN manquants
 * (jamais de DROP) pour aligner la DB prod sur les entités du code déployé.
 */
@Injectable()
export class DatabaseSchemaService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSchemaService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    if (!this.shouldEnsureSchema()) {
      return;
    }

    if (!this.dataSource.isInitialized) {
      this.logger.warn('DataSource not initialized, skipping schema ensure');
      return;
    }

    await this.ensurePostgis();
    await this.ensureMissingSchema();
  }

  private shouldEnsureSchema(): boolean {
    if (process.env.DB_ENSURE_SCHEMA === 'false') {
      return false;
    }
    if (process.env.NODE_ENV === 'production') {
      return true;
    }
    return process.env.DB_ENSURE_SCHEMA === 'true';
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
