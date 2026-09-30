import {
  CLIENT_APPLICATION_ID,
  OTHER_CLIENT_APPLICATION_ID,
  makePermission,
  makeRole,
} from '../../../@testing/builders.js';
import InMemoryRoleRepository from '../../../@testing/fakes/in-memory-role.repository.js';
import ListRolesUseCase from './list-roles.use-case.js';

const makeSut = () => {
  const roleRepository = new InMemoryRoleRepository().seed(
    makeRole({ id: 'role-1', name: 'admin' }),
    makeRole({ id: 'role-2', name: 'editor' }),
    makeRole({ id: 'role-3', name: 'viewer' }),
    makeRole({
      id: 'role-other',
      name: 'admin',
      clientApplicationId: OTHER_CLIENT_APPLICATION_ID,
      permissions: [makePermission({ clientApplicationId: OTHER_CLIENT_APPLICATION_ID })],
    }),
  );
  return new ListRolesUseCase(roleRepository);
};

describe('ListRolesUseCase', () => {
  it('only lists the roles of the given client application (tenant isolation)', async () => {
    const output = await makeSut().execute({
      clientApplicationId: CLIENT_APPLICATION_ID,
      page: 1,
      limit: 10,
    });

    expect(output.items.map((role) => role.id)).toEqual(['role-1', 'role-2', 'role-3']);
    expect(output).toMatchObject({ total: 3, page: 1, limit: 10, totalPages: 1 });
  });

  it('paginates the results', async () => {
    const output = await makeSut().execute({
      clientApplicationId: CLIENT_APPLICATION_ID,
      page: 2,
      limit: 2,
    });

    expect(output.items.map((role) => role.id)).toEqual(['role-3']);
    expect(output).toMatchObject({ total: 3, page: 2, limit: 2, totalPages: 2 });
  });

  it('includes the permissions of each role', async () => {
    const output = await makeSut().execute({
      clientApplicationId: CLIENT_APPLICATION_ID,
      page: 1,
      limit: 1,
    });

    expect(output.items[0]?.permissions).toHaveLength(1);
  });
});
