import {
  OTHER_CLIENT_APPLICATION_ID,
  makePermission,
  makeRole,
} from '../../../@testing/builders.js';
import InMemoryPermissionRepository from '../../../@testing/fakes/in-memory-permission.repository.js';
import InMemoryRoleRepository from '../../../@testing/fakes/in-memory-role.repository.js';
import PermissionNotFoundError from '../../../domain/role/error/permission-not-found-error.js';
import RoleNotFoundError from '../../../domain/role/error/role-not-found-error.js';
import AssignPermissionsToRoleUseCase from './assign-permissions-to-role.use-case.js';

const makeSut = () => {
  const roleRepository = new InMemoryRoleRepository().seed(
    makeRole({
      id: 'role-1',
      permissions: [makePermission({ id: 'perm-read', action: 'read' })],
    }),
  );
  const permissionRepository = new InMemoryPermissionRepository().seed(
    makePermission({ id: 'perm-read', action: 'read' }),
    makePermission({ id: 'perm-write', action: 'write' }),
    makePermission({ id: 'perm-foreign', clientApplicationId: OTHER_CLIENT_APPLICATION_ID }),
  );
  return {
    useCase: new AssignPermissionsToRoleUseCase(roleRepository, permissionRepository),
    roleRepository,
  };
};

const permissionIdsOf = async (roleRepository: InMemoryRoleRepository) =>
  (await roleRepository.findById('role-1'))?.permissions.map((permission) => permission.id);

describe('AssignPermissionsToRoleUseCase', () => {
  it('replaces the permissions of the role and persists the change', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ roleId: 'role-1', permissionIds: ['perm-write'] });

    expect(output.permissions.map((permission) => permission.id)).toEqual(['perm-write']);
    expect(await permissionIdsOf(sut.roleRepository)).toEqual(['perm-write']);
  });

  it('fails when the role does not exist', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ roleId: 'missing', permissionIds: ['perm-write'] }),
    ).rejects.toThrow(RoleNotFoundError);
  });

  it('fails when a permission does not exist and keeps the current permissions', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ roleId: 'role-1', permissionIds: ['perm-write', 'missing'] }),
    ).rejects.toThrow(new PermissionNotFoundError('missing'));

    expect(await permissionIdsOf(sut.roleRepository)).toEqual(['perm-read']);
  });

  it('cannot assign permissions of another client application (tenant isolation)', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ roleId: 'role-1', permissionIds: ['perm-foreign'] }),
    ).rejects.toThrow(new PermissionNotFoundError('perm-foreign'));

    expect(await permissionIdsOf(sut.roleRepository)).toEqual(['perm-read']);
  });

  it('refuses to leave the role without permissions', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ roleId: 'role-1', permissionIds: [] })).rejects.toThrow(
      'Role must have at least one permission',
    );

    expect(await permissionIdsOf(sut.roleRepository)).toEqual(['perm-read']);
  });
});
