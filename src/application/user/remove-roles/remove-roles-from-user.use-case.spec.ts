import {
  CLIENT_APPLICATION_ID,
  OTHER_CLIENT_APPLICATION_ID,
  makePermission,
  makeRole,
  makeUser,
} from '../../../@testing/builders.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import RoleNotFoundError from '../../../domain/role/error/role-not-found-error.js';
import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import RemoveRolesFromUserUseCase from './remove-roles-from-user.use-case.js';

const admin = makeRole({ id: 'role-admin', name: 'admin' });
const editor = makeRole({ id: 'role-editor', name: 'editor' });
const foreign = makeRole({
  id: 'role-foreign',
  name: 'foreign',
  clientApplicationId: OTHER_CLIENT_APPLICATION_ID,
  permissions: [makePermission({ clientApplicationId: OTHER_CLIENT_APPLICATION_ID })],
});

const makeSut = () => {
  const userRepository = new InMemoryUserRepository().seed(
    makeUser({ id: 'user-1', roles: [admin, editor, foreign] }),
  );
  return { useCase: new RemoveRolesFromUserUseCase(userRepository), userRepository };
};

const rolesOf = async (userRepository: InMemoryUserRepository) =>
  (await userRepository.findById('user-1'))?.roles.map((role) => role.id);

describe('RemoveRolesFromUserUseCase', () => {
  it('removes the given roles and persists the result', async () => {
    const sut = makeSut();

    await sut.useCase.execute({
      userId: 'user-1',
      roleIds: ['role-admin'],
      clientApplicationId: CLIENT_APPLICATION_ID,
    });

    expect(await rolesOf(sut.userRepository)).toEqual(['role-editor', 'role-foreign']);
  });

  it('does not remove a role that belongs to another client application (tenant isolation)', async () => {
    const sut = makeSut();

    await sut.useCase.execute({
      userId: 'user-1',
      roleIds: ['role-foreign'],
      clientApplicationId: CLIENT_APPLICATION_ID,
    });

    expect(await rolesOf(sut.userRepository)).toContain('role-foreign');
  });

  it('fails when the user does not exist', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({
        userId: 'missing',
        roleIds: ['role-admin'],
        clientApplicationId: CLIENT_APPLICATION_ID,
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('fails when the user does not hold the role, and removes nothing', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({
        userId: 'user-1',
        roleIds: ['role-admin', 'role-not-assigned'],
        clientApplicationId: CLIENT_APPLICATION_ID,
      }),
    ).rejects.toThrow(new RoleNotFoundError('role-not-assigned'));

    expect(await rolesOf(sut.userRepository)).toEqual([
      'role-admin',
      'role-editor',
      'role-foreign',
    ]);
  });
});
