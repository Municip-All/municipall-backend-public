import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface TableSchemaRow {
  table_name: string;
}

interface ColumnSchemaRow {
  column_name: string;
  data_type: string;
}

interface CountRow {
  count: string;
}

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly dataSource: DataSource) {}

  async getTables(): Promise<string[]> {
    try {
      // Postgres specific query to list public tables
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;
      const result = (await this.dataSource.query(query)) as unknown as TableSchemaRow[];
      return result.map((row: TableSchemaRow) => row.table_name);
    } catch (error) {
      this.logger.error('Error fetching tables:', error);
      throw new InternalServerErrorException('Failed to fetch tables');
    }
  }

  async getTableData(tableName: string, limit: number = 50, offset: number = 0) {
    try {
      // Basic protection against SQL injection on table name
      if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        throw new Error('Invalid table name');
      }

      // Fetch columns
      const columnQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1;
      `;
      const columns = (await this.dataSource.query(columnQuery, [
        tableName,
      ])) as unknown as ColumnSchemaRow[];

      // Fetch data
      const dataQuery = `SELECT * FROM "${tableName}" LIMIT $1 OFFSET $2;`;
      const data = (await this.dataSource.query(dataQuery, [limit, offset])) as unknown as Record<
        string,
        unknown
      >[];

      // Fetch total count
      const countQuery = `SELECT COUNT(*) FROM "${tableName}";`;
      const countResult = (await this.dataSource.query(countQuery)) as unknown as CountRow[];
      const total = parseInt(String(countResult[0].count), 10);

      return {
        columns: columns.map((col: ColumnSchemaRow) => ({
          name: col.column_name,
          type: col.data_type,
        })),
        data,
        total,
      };
    } catch (error) {
      this.logger.error(`Error fetching data for table ${tableName}:`, error);
      throw new InternalServerErrorException(`Failed to fetch data for table ${tableName}`);
    }
  }

  async executeQuery(query: string): Promise<Record<string, unknown>[] | { error: string }> {
    try {
      const statements = query
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (statements.length !== 1) {
        return { error: 'Seules les requêtes SELECT simples sont autorisées.' };
      }

      const upper = statements[0].toUpperCase();
      if (!upper.startsWith('SELECT')) {
        return { error: 'Seules les requêtes SELECT sont autorisées.' };
      }

      const FORBIDDEN = [
        'DROP',
        'DELETE',
        'INSERT',
        'UPDATE',
        'ALTER',
        'CREATE',
        'TRUNCATE',
        'GRANT',
        'REVOKE',
        'COPY',
        'VACUUM',
        'REINDEX',
        'CLUSTER',
      ];
      for (const kw of FORBIDDEN) {
        if (upper.includes(kw)) {
          return { error: `Opération interdite : ${kw}. Seuls les SELECT sont autorisés.` };
        }
      }

      const result = (await this.dataSource.query(query)) as unknown as Record<string, unknown>[];
      return result;
    } catch (error) {
      this.logger.error('Error executing query:', error);
      const err = error as Error;
      return { error: err.message || 'Query execution failed' };
    }
  }
}
