import { CLIENT_APPLICATION_ID, makePermission, makeRole } from '../../../@testing/builders.js';
import InMemoryRoleRepository from '../../../@testing/fakes/in-memory-role.repository.js';
import GetRoleUseCase from './get-role.use-case.js';

describe('GetRoleUseCase', () => {
  it('returns the role with its permissions as an output DTO', async () => {
    const permission = makePermission({ id: 'perm-1', resource: 'users', action: 'read' });
    const roleRepository = new InMemoryRoleRepository().seed(
      makeRole({
        id: 'role-1',
        name: 'admin',
        description: 'Administrator',
        permissions: [permission],
      }),
    );

    const output = await new GetRoleUseCase(roleRepository).execute({ roleId: 'role-1' });

    expect(output).toEqual({
      id: 'role-1',
      clientApplicationId: CLIENT_APPLICATION_ID,
      name: 'admin',
      description: 'Administrator',
      permissions: [
        {
          id: 'perm-1',
          clientApplicationId: CLIENT_APPLICATION_ID,
          name: 'Read users',
          resource: 'users',
          action: 'read',
          description: 'Allows reading users',
        },
      ],
    });
  });

  it('returns null when the role does not exist', async () => {
    const useCase = new GetRoleUseCase(new InMemoryRoleRepository());

    expect(await useCase.execute({ roleId: 'missing' })).toBeNull();
  });
});
