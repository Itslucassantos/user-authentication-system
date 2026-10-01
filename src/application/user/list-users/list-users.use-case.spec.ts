import {
  CLIENT_APPLICATION_ID,
  OTHER_CLIENT_APPLICATION_ID,
  makePermission,
  makeRole,
  makeUser,
} from '../../../@testing/builders.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import ListUsersUseCase from './list-users.use-case.js';

const otherAppRole = makeRole({
  clientApplicationId: OTHER_CLIENT_APPLICATION_ID,
  permissions: [makePermission({ clientApplicationId: OTHER_CLIENT_APPLICATION_ID })],
});

const makeSut = () => {
  const userRepository = new InMemoryUserRepository().seed(
    makeUser({ id: 'user-1', name: 'Ana', email: 'ana@example.com', roles: [makeRole()] }),
    makeUser({ id: 'user-2', name: 'Bob', email: 'bob@example.com', roles: [otherAppRole] }),
    makeUser({ id: 'user-3', name: 'Cid', email: 'cid@example.com' }),
  );
  return { useCase: new ListUsersUseCase(userRepository), userRepository };
};

describe('ListUsersUseCase', () => {
  it('lists every user when no client application is given', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ page: 1, limit: 10 });

    expect(output.items.map((user) => user.id)).toEqual(['user-1', 'user-2', 'user-3']);
    expect(output).toMatchObject({ total: 3, page: 1, limit: 10, totalPages: 1 });
  });

  it('only lists users with roles in the given client application', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({
      page: 1,
      limit: 10,
      clientApplicationId: CLIENT_APPLICATION_ID,
    });

    expect(output.items.map((user) => user.id)).toEqual(['user-1']);
    expect(output.total).toBe(1);
  });

  it('maps users to their public data', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ page: 1, limit: 1 });

    expect(output.items).toEqual([
      { id: 'user-1', name: 'Ana', email: 'ana@example.com', active: true },
    ]);
  });

  it('paginates the results', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ page: 2, limit: 2 });

    expect(output.items.map((user) => user.id)).toEqual(['user-3']);
    expect(output).toMatchObject({ total: 3, page: 2, limit: 2, totalPages: 2 });
  });

  it('returns an empty page when nothing matches', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({
      page: 1,
      limit: 10,
      clientApplicationId: 'unknown-app',
    });

    expect(output).toEqual({ items: [], total: 0, page: 1, limit: 10, totalPages: 0 });
  });
});
