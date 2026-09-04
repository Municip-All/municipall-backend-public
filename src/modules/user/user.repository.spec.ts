import { DataSource } from 'typeorm';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  it('createUser creates and saves', async () => {
    const manager = {};
    const dataSource = {
      createEntityManager: jest.fn().mockReturnValue(manager),
    } as unknown as DataSource;

    const repo = new UserRepository(dataSource);
    const created = { id: 1, email: 'a@b.c' };
    jest.spyOn(repo, 'create').mockReturnValue(created as never);
    jest.spyOn(repo, 'save').mockResolvedValue(created as never);

    const result = await repo.createUser({
      email: 'a@b.c',
      password: 'x',
      name: 'A',
      surname: 'B',
    } as never);

    expect(dataSource.createEntityManager).toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });
});
