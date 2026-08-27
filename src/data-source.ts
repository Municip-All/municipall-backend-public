import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const databasePassword = process.env.DATABASE_PASSWORD;
if (!databasePassword) {
  throw new TypeError('DATABASE_PASSWORD env variable is required');
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: databasePassword,
  database: process.env.DATABASE_NAME || 'municipall',
  migrations: [__dirname + '/migrations/*.ts'],
  migrationsRun: false,
});
