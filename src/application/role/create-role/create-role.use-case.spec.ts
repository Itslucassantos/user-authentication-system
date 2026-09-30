import {
  CLIENT_APPLICATION_ID,
  OTHER_CLIENT_APPLICATION_ID,
  makeClientApplication,
  makePermission,
  makeRole,
} from '../../../@testing/builders.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import InMemoryPermissionRepository from '../../../@testing/fakes/in-memory-permission.repository.js';
import InMemoryRoleRepository from '../../../@testing/fakes/in-memory-role.repository.js';
import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import PermissionNotFoundError from '../../../domain/role/error/permission-not-found-error.js';
import RoleAlreadyExistsError from '../../../domain/role/error/role-already-exists-error.js';
import CreateRoleUseCase from './create-role.use-case.js';

const makeSut = () => {
  const roleRepository = new InMemoryRoleRepository();
  const permissionRepository = new InMemoryPermissionRepository().seed(
    makePermission({ id: 'perm-read', action: 'read' }),
    makePermission({ id: 'perm-write', action: 'write' }),
    makePermission({
      id: 'perm-foreign',
      clientApplicationId: OTHER_CLIENT_APPLICATION_ID,
    }),
  );
  const clientApplicationRepository = new InMemoryClientApplicationRepository().seed(
    makeClientApplication(),
  );
  const useCase = new CreateRoleUseCase(
    roleRepository,
    permissionRepository,
    clientApplicationRepository,
  );
  return { useCase, roleRepository };
};

const input = {
  clientApplicationId: CLIENT_APPLICATION_ID,
  name: 'admin',
  description: 'Administrator',
  permissionIds: ['perm-read', 'perm-write'],
};

describe('CreateRoleUseCase', () => {
  it('creates the role with its permissions and persists it', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute(input);

    expect(output).toMatchObject({
      id: expect.any(String),
      clientApplicationId: CLIENT_APPLICATION_ID,
      name: 'admin',
      description: 'Administrator',
    });
    expect(output.permissions.map((permission) => permission.id)).toEqual([
      'perm-read',
      'perm-write',
    ]);
    expect(await sut.roleRepository.findById(output.id)).not.toBeNull();
  });

  it('fails when the client application does not exist', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ ...input, clientApplicationId: 'missing' })).rejects.toThrow(
      ClientApplicationNotFoundError,
    );
    expect(sut.roleRepository.all()).toHaveLength(0);
  });

  it('refuses a duplicated name within the client application', async () => {
    const sut = makeSut();
    sut.roleRepository.seed(makeRole({ name: 'admin' }));

    await expect(sut.useCase.execute(input)).rejects.toThrow(RoleAlreadyExistsError);
    expect(sut.roleRepository.all()).toHaveLength(1);
  });

  it('fails when a permission does not exist', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ ...input, permissionIds: ['perm-read', 'missing'] }),
    ).rejects.toThrow(new PermissionNotFoundError('missing'));
    expect(sut.roleRepository.all()).toHaveLength(0);
  });

  it('cannot reference permissions of another client application (tenant isolation)', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ ...input, permissionIds: ['perm-read', 'perm-foreign'] }),
    ).rejects.toThrow(new PermissionNotFoundError('perm-foreign'));
  });

  it('requires at least one permission', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ ...input, permissionIds: [] })).rejects.toThrow(
      'Role must have at least one permission',
    );
    expect(sut.roleRepository.all()).toHaveLength(0);
  });
});
