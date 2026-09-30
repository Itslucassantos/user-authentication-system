import { CLIENT_APPLICATION_ID, makePermission } from '../../../@testing/builders.js';
import InMemoryPermissionRepository from '../../../@testing/fakes/in-memory-permission.repository.js';
import GetPermissionUseCase from './get-permission.use-case.js';

describe('GetPermissionUseCase', () => {
  it('returns the permission as an output DTO', async () => {
    const permissionRepository = new InMemoryPermissionRepository().seed(
      makePermission({
        id: 'perm-1',
        name: 'Read users',
        resource: 'users',
        action: 'read',
        description: 'Allows reading users',
      }),
    );

    const output = await new GetPermissionUseCase(permissionRepository).execute({
      permissionId: 'perm-1',
    });

    expect(output).toEqual({
      id: 'perm-1',
      clientApplicationId: CLIENT_APPLICATION_ID,
      name: 'Read users',
      resource: 'users',
      action: 'read',
      description: 'Allows reading users',
    });
  });

  it('returns null when the permission does not exist', async () => {
    const useCase = new GetPermissionUseCase(new InMemoryPermissionRepository());

    expect(await useCase.execute({ permissionId: 'missing' })).toBeNull();
  });
});
