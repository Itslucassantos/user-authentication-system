import { makeRole } from '../../../@testing/builders.js';
import InMemoryRoleRepository from '../../../@testing/fakes/in-memory-role.repository.js';
import RoleNotFoundError from '../../../domain/role/error/role-not-found-error.js';
import DeleteRoleUseCase from './delete-role.use-case.js';

describe('DeleteRoleUseCase', () => {
  it('removes only the requested role', async () => {
    const roleRepository = new InMemoryRoleRepository().seed(
      makeRole({ id: 'role-1', name: 'admin' }),
      makeRole({ id: 'role-2', name: 'editor' }),
    );

    await new DeleteRoleUseCase(roleRepository).execute({ roleId: 'role-1' });

    expect(roleRepository.all().map((role) => role.id)).toEqual(['role-2']);
  });

  it('propagates the not found error raised by the repository', async () => {
    const useCase = new DeleteRoleUseCase(new InMemoryRoleRepository());

    await expect(useCase.execute({ roleId: 'missing' })).rejects.toThrow(RoleNotFoundError);
  });
});
