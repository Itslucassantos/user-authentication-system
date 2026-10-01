import {
  OTHER_CLIENT_APPLICATION_ID,
  makePermission,
  makeRole,
} from '../../../@testing/builders.js';
import InMemoryRoleRepository from '../../../@testing/fakes/in-memory-role.repository.js';
import RoleAlreadyExistsError from '../../../domain/role/error/role-already-exists-error.js';
import RoleNotFoundError from '../../../domain/role/error/role-not-found-error.js';
import UpdateRoleUseCase from './update-role.use-case.js';

const makeSut = () => {
  const roleRepository = new InMemoryRoleRepository().seed(
    makeRole({ id: 'role-1', name: 'admin', description: 'Administrator' }),
    makeRole({ id: 'role-2', name: 'editor', description: 'Editor' }),
    makeRole({
      id: 'role-other',
      name: 'auditor',
      clientApplicationId: OTHER_CLIENT_APPLICATION_ID,
      permissions: [makePermission({ clientApplicationId: OTHER_CLIENT_APPLICATION_ID })],
    }),
  );
  return { useCase: new UpdateRoleUseCase(roleRepository), roleRepository };
};

describe('UpdateRoleUseCase', () => {
  it('updates name and description, persists them and returns the new state', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({
      roleId: 'role-1',
      name: 'super-admin',
      description: 'Super administrator',
    });

    expect(output).toMatchObject({ name: 'super-admin', description: 'Super administrator' });
    expect((await sut.roleRepository.findById('role-1'))?.name).toBe('super-admin');
  });

  it('lets a role keep its own name', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ roleId: 'role-1', name: 'admin', description: 'New description' }),
    ).resolves.toMatchObject({ name: 'admin', description: 'New description' });
  });

  it('refuses a name already taken by another role of the same client application', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ roleId: 'role-1', name: 'editor', description: 'x' }),
    ).rejects.toThrow(RoleAlreadyExistsError);
    expect((await sut.roleRepository.findById('role-1'))?.name).toBe('admin');
  });

  it('allows a name used by a role of a different client application', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ roleId: 'role-1', name: 'auditor', description: 'x' }),
    ).resolves.toMatchObject({ name: 'auditor' });
  });

  it('fails when the role does not exist', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ roleId: 'missing', name: 'x', description: 'x' }),
    ).rejects.toThrow(RoleNotFoundError);
  });

  it('enforces the role invariants', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ roleId: 'role-1', name: 'admin', description: '' }),
    ).rejects.toThrow('Role description is required');
  });
});
