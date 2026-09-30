import { makePermission } from '../../../@testing/builders.js';
import InMemoryPermissionRepository from '../../../@testing/fakes/in-memory-permission.repository.js';
import PermissionInUseError from '../../../domain/role/error/permission-in-use-error.js';
import PermissionNotFoundError from '../../../domain/role/error/permission-not-found-error.js';
import DeletePermissionUseCase from './delete-permission.use-case.js';

describe('DeletePermissionUseCase', () => {
  it('deletes a permission that no role uses', async () => {
    const permissionRepository = new InMemoryPermissionRepository().seed(
      makePermission({ id: 'perm-1' }),
    );

    await new DeletePermissionUseCase(permissionRepository).execute({ permissionId: 'perm-1' });

    expect(permissionRepository.all()).toHaveLength(0);
  });

  it('refuses to delete a permission that is assigned to a role', async () => {
    const permissionRepository = new InMemoryPermissionRepository()
      .seed(makePermission({ id: 'perm-1' }))
      .markAsInUse('perm-1');

    await expect(
      new DeletePermissionUseCase(permissionRepository).execute({ permissionId: 'perm-1' }),
    ).rejects.toThrow(PermissionInUseError);

    expect(permissionRepository.all()).toHaveLength(1);
  });

  it('propagates the not found error raised by the repository', async () => {
    const useCase = new DeletePermissionUseCase(new InMemoryPermissionRepository());

    await expect(useCase.execute({ permissionId: 'missing' })).rejects.toThrow(
      PermissionNotFoundError,
    );
  });
});
