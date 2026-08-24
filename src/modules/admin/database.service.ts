import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
      console.error('Error fetching tables:', error);
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
      console.error(`Error fetching data for table ${tableName}:`, error);
      throw new InternalServerErrorException(`Failed to fetch data for table ${tableName}`);
    }
  }

  private static readonly FORBIDDEN_KEYWORDS = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE',
    'GRANT', 'REVOKE', 'COPY', 'VACUUM', 'REINDEX', 'CLUSTER',
  ];

  async executeQuery(query: string): Promise<Record<string, unknown>[] | { error: string }> {
    try {
      const upper = query.trim().toUpperCase();
      for (const kw of DatabaseService.FORBIDDEN_KEYWORDS) {
        if (upper.startsWith(kw + ' ') || upper.startsWith(kw + ';') || upper === kw) {
          return { error: `Opération interdite : ${kw}. Seuls les SELECT sont autorisés.` };
        }
      }
      if (!upper.startsWith('SELECT')) {
        return { error: 'Seules les requêtes SELECT sont autorisées.' };
      }
      const result = (await this.dataSource.query(query)) as unknown as Record<string, unknown>[];
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      const err = error as Error;
      return { error: err.message || 'Query execution failed' };
    }
  }
}
