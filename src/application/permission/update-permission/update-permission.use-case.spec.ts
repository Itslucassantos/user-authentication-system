import { makePermission } from '../../../@testing/builders.js';
import InMemoryPermissionRepository from '../../../@testing/fakes/in-memory-permission.repository.js';
import PermissionNotFoundError from '../../../domain/role/error/permission-not-found-error.js';
import UpdatePermissionUseCase from './update-permission.use-case.js';

const makeSut = () => {
  const permissionRepository = new InMemoryPermissionRepository().seed(
    makePermission({ id: 'perm-1', description: 'old' }),
  );
  return { useCase: new UpdatePermissionUseCase(permissionRepository), permissionRepository };
};

describe('UpdatePermissionUseCase', () => {
  it('updates the description, persists it and returns the new state', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ permissionId: 'perm-1', description: 'new' });

    expect(output.description).toBe('new');
    expect((await sut.permissionRepository.findById('perm-1'))?.description).toBe('new');
  });

  it('clears the description when none is given', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ permissionId: 'perm-1' });

    expect(output.description).toBe('');
  });

  it('does not change what identifies the permission', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ permissionId: 'perm-1', description: 'new' });

    expect(output).toMatchObject({ resource: 'users', action: 'read', name: 'Read users' });
  });

  it('fails when the permission does not exist', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ permissionId: 'missing', description: 'x' }),
    ).rejects.toThrow(PermissionNotFoundError);
  });
});
