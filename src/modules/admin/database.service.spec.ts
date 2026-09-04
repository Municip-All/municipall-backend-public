import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;
  const query = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService, { provide: DataSource, useValue: { query } }],
    }).compile();
    service = module.get(DatabaseService);
  });

  describe('getTables', () => {
    it('returns table names', async () => {
      query.mockResolvedValue([{ table_name: 'users' }, { table_name: 'cities' }]);
      await expect(service.getTables()).resolves.toEqual(['users', 'cities']);
    });

    it('wraps errors', async () => {
      query.mockRejectedValue(new Error('db'));
      await expect(service.getTables()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getTableData', () => {
    it('returns columns, data, total for valid name', async () => {
      query
        .mockResolvedValueOnce([{ column_name: 'id', data_type: 'integer' }])
        .mockResolvedValueOnce([{ id: 1 }])
        .mockResolvedValueOnce([{ count: '1' }]);

      await expect(service.getTableData('users', 10, 0)).resolves.toEqual({
        columns: [{ name: 'id', type: 'integer' }],
        data: [{ id: 1 }],
        total: 1,
      });
    });

    it('rejects invalid table name (wrapped as 500)', async () => {
      // BadRequestException is thrown inside try and re-wrapped by catch
      await expect(service.getTableData('users;drop', 10, 0)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('executeQuery', () => {
    it('runs simple SELECT', async () => {
      query.mockResolvedValue([{ n: 1 }]);
      await expect(service.executeQuery('SELECT 1')).resolves.toEqual([{ n: 1 }]);
    });

    it('rejects multi-statement', async () => {
      await expect(service.executeQuery('SELECT 1; SELECT 2')).resolves.toEqual({
        error: 'Seules les requêtes SELECT simples sont autorisées.',
      });
    });

    it('rejects non-SELECT', async () => {
      await expect(service.executeQuery('DELETE FROM users')).resolves.toEqual({
        error: 'Seules les requêtes SELECT sont autorisées.',
      });
    });

    it('rejects forbidden keywords inside SELECT', async () => {
      await expect(service.executeQuery('SELECT * FROM users; DROP TABLE users')).resolves.toEqual({
        error: 'Seules les requêtes SELECT simples sont autorisées.',
      });
      const sleepResult = (await service.executeQuery('SELECT pg_sleep(1); -- DROP')) as {
        error: string;
      };
      expect(sleepResult.error).toEqual(expect.stringContaining('Seules'));
      await expect(service.executeQuery('SELECT * FROM t WHERE x = DROP')).resolves.toEqual({
        error: 'Opération interdite : DROP. Seuls les SELECT sont autorisés.',
      });
    });

    it('returns error message on query failure', async () => {
      query.mockRejectedValue(new Error('syntax'));
      await expect(service.executeQuery('SELECT bad')).resolves.toEqual({ error: 'syntax' });
    });
  });
});
