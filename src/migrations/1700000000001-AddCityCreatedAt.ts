import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCityCreatedAt1700000000001 implements MigrationInterface {
  name = 'AddCityCreatedAt1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cities
      ADD COLUMN IF NOT EXISTS created_at timestamptz
    `);

    await queryRunner.query(`
      UPDATE cities
      SET created_at = contract_signed_at::timestamptz
      WHERE created_at IS NULL AND contract_signed_at IS NOT NULL
    `);

    await queryRunner.query(`
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

    await queryRunner.query(`
      UPDATE cities
      SET created_at = TIMESTAMPTZ '2020-01-01 00:00:00+00'
      WHERE created_at IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE cities
      ALTER COLUMN created_at SET DEFAULT NOW(),
      ALTER COLUMN created_at SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cities DROP COLUMN IF EXISTS created_at`);
  }
}
