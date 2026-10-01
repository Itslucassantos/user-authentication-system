import {
  CLIENT_APPLICATION_ID,
  OTHER_CLIENT_APPLICATION_ID,
  makePermission,
} from '../../../@testing/builders.js';
import InMemoryPermissionRepository from '../../../@testing/fakes/in-memory-permission.repository.js';
import ListPermissionsUseCase from './list-permissions.use-case.js';

const makeSut = () => {
  const permissionRepository = new InMemoryPermissionRepository().seed(
    makePermission({ id: 'perm-1', action: 'read' }),
    makePermission({ id: 'perm-2', action: 'write' }),
    makePermission({ id: 'perm-3', action: 'delete' }),
    makePermission({ id: 'perm-other', clientApplicationId: OTHER_CLIENT_APPLICATION_ID }),
  );
  return new ListPermissionsUseCase(permissionRepository);
};

describe('ListPermissionsUseCase', () => {
  it('only lists the permissions of the given client application (tenant isolation)', async () => {
    const output = await makeSut().execute({
      clientApplicationId: CLIENT_APPLICATION_ID,
      page: 1,
      limit: 10,
    });

    expect(output.items.map((permission) => permission.id)).toEqual(['perm-1', 'perm-2', 'perm-3']);
    expect(output).toMatchObject({ total: 3, page: 1, limit: 10, totalPages: 1 });
  });

  it('paginates the results', async () => {
    const output = await makeSut().execute({
      clientApplicationId: CLIENT_APPLICATION_ID,
      page: 2,
      limit: 2,
    });

    expect(output.items.map((permission) => permission.id)).toEqual(['perm-3']);
    expect(output).toMatchObject({ total: 3, page: 2, limit: 2, totalPages: 2 });
  });

  it('maps every item to the output DTO', async () => {
    const output = await makeSut().execute({
      clientApplicationId: CLIENT_APPLICATION_ID,
      page: 1,
      limit: 1,
    });

    expect(output.items[0]).toEqual({
      id: 'perm-1',
      clientApplicationId: CLIENT_APPLICATION_ID,
      name: 'Read users',
      resource: 'users',
      action: 'read',
      description: 'Allows reading users',
    });
  });
});
