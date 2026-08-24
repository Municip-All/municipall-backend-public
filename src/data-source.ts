import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password:
    process.env.DATABASE_PASSWORD ??
    (() => {
      throw new Error('DATABASE_PASSWORD env variable is required');
    })(),
  database: process.env.DATABASE_NAME || 'municipall',
  migrations: [__dirname + '/migrations/*.ts'],
  migrationsRun: false,
});
