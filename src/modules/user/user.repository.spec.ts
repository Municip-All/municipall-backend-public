import { DataSource } from 'typeorm';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  it('createUser creates and saves', async () => {
    const manager = {};
    const createEntityManager = jest.fn().mockReturnValue(manager);
    const dataSource = {
      createEntityManager,
    } as unknown as DataSource;

    const repo = new UserRepository(dataSource);
    const created = { id: 1, email: 'a@b.c' };
    const createSpy = jest.spyOn(repo, 'create').mockReturnValue(created as never);
    const saveSpy = jest.spyOn(repo, 'save').mockResolvedValue(created as never);

    const result = await repo.createUser({
      email: 'a@b.c',
      password: 'x',
      name: 'A',
      surname: 'B',
    } as never);

    expect(createEntityManager).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalled();
    expect(saveSpy).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });
});
