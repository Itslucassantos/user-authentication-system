import {
  CLIENT_APPLICATION_ID,
  makeClientApplication,
  makePermission,
} from '../../../@testing/builders.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import InMemoryPermissionRepository from '../../../@testing/fakes/in-memory-permission.repository.js';
import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import PermissionAlreadyExistsError from '../../../domain/role/error/permission-already-exists-error.js';
import CreatePermissionUseCase from './create-permission.use-case.js';

const makeSut = () => {
  const permissionRepository = new InMemoryPermissionRepository();
  const clientApplicationRepository = new InMemoryClientApplicationRepository().seed(
    makeClientApplication(),
  );
  return {
    useCase: new CreatePermissionUseCase(permissionRepository, clientApplicationRepository),
    permissionRepository,
  };
};

const input = {
  clientApplicationId: CLIENT_APPLICATION_ID,
  name: 'Read users',
  resource: 'users',
  action: 'read',
  description: 'Allows reading users',
};

describe('CreatePermissionUseCase', () => {
  it('creates and persists the permission', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute(input);

    expect(output).toEqual({ id: expect.any(String), ...input });
    expect(await sut.permissionRepository.findById(output.id)).not.toBeNull();
  });

  it('defaults the description to an empty string', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ ...input, description: undefined as never });

    expect(output.description).toBe('');
  });

  it('fails when the client application does not exist', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ ...input, clientApplicationId: 'missing' })).rejects.toThrow(
      ClientApplicationNotFoundError,
    );
    expect(sut.permissionRepository.all()).toHaveLength(0);
  });

  it('refuses a duplicated resource/action pair within the same client application', async () => {
    const sut = makeSut();
    sut.permissionRepository.seed(makePermission({ resource: 'users', action: 'read' }));

    await expect(sut.useCase.execute(input)).rejects.toThrow(PermissionAlreadyExistsError);
    expect(sut.permissionRepository.all()).toHaveLength(1);
  });

  it('allows the same resource/action pair in a different client application', async () => {
    const sut = makeSut();
    sut.permissionRepository.seed(
      makePermission({ clientApplicationId: 'another-app', resource: 'users', action: 'read' }),
    );

    await expect(sut.useCase.execute(input)).resolves.toMatchObject({ resource: 'users' });
  });

  it('enforces the entity invariants', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ ...input, name: '' })).rejects.toThrow(
      'Permission name is required',
    );
  });
});
