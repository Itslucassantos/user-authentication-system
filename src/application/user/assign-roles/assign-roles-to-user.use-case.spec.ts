import {
  CLIENT_APPLICATION_ID,
  OTHER_CLIENT_APPLICATION_ID,
  makePermission,
  makeRole,
  makeUser,
} from '../../../@testing/builders.js';
import InMemoryRoleRepository from '../../../@testing/fakes/in-memory-role.repository.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import RoleNotFoundError from '../../../domain/role/error/role-not-found-error.js';
import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import AssignRolesToUserUseCase from './assign-roles-to-user.use-case.js';

const admin = makeRole({ id: 'role-admin', name: 'admin' });
const editor = makeRole({ id: 'role-editor', name: 'editor' });
const foreign = makeRole({
  id: 'role-foreign',
  name: 'foreign',
  clientApplicationId: OTHER_CLIENT_APPLICATION_ID,
  permissions: [makePermission({ clientApplicationId: OTHER_CLIENT_APPLICATION_ID })],
});

const makeSut = () => {
  const userRepository = new InMemoryUserRepository().seed(makeUser({ id: 'user-1' }));
  const roleRepository = new InMemoryRoleRepository().seed(admin, editor, foreign);
  return {
    useCase: new AssignRolesToUserUseCase(userRepository, roleRepository),
    userRepository,
  };
};

const rolesOf = async (userRepository: InMemoryUserRepository) =>
  (await userRepository.findById('user-1'))?.roles.map((role) => role.id);

describe('AssignRolesToUserUseCase', () => {
  it('assigns the roles and persists them', async () => {
    const sut = makeSut();

    await sut.useCase.execute({
      userId: 'user-1',
      roleIds: ['role-admin', 'role-editor'],
      clientApplicationId: CLIENT_APPLICATION_ID,
    });

    expect(await rolesOf(sut.userRepository)).toEqual(['role-admin', 'role-editor']);
  });

  it('keeps the roles the user already had and never duplicates them', async () => {
    const sut = makeSut();
    sut.userRepository.seed(makeUser({ id: 'user-1', roles: [admin] }));

    await sut.useCase.execute({
      userId: 'user-1',
      roleIds: ['role-admin', 'role-editor'],
      clientApplicationId: CLIENT_APPLICATION_ID,
    });

    expect(await rolesOf(sut.userRepository)).toEqual(['role-admin', 'role-editor']);
  });

  it('keeps roles the user holds in other client applications', async () => {
    const sut = makeSut();
    sut.userRepository.seed(makeUser({ id: 'user-1', roles: [foreign] }));

    await sut.useCase.execute({
      userId: 'user-1',
      roleIds: ['role-admin'],
      clientApplicationId: CLIENT_APPLICATION_ID,
    });

    expect(await rolesOf(sut.userRepository)).toEqual(['role-foreign', 'role-admin']);
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

  it('fails when a role does not exist and assigns nothing', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({
        userId: 'user-1',
        roleIds: ['role-admin', 'missing'],
        clientApplicationId: CLIENT_APPLICATION_ID,
      }),
    ).rejects.toThrow(new RoleNotFoundError('missing'));

    expect(await rolesOf(sut.userRepository)).toEqual([]);
  });

  it('hides roles of other client applications behind a not found error (tenant isolation)', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({
        userId: 'user-1',
        roleIds: ['role-admin', 'role-foreign'],
        clientApplicationId: CLIENT_APPLICATION_ID,
      }),
    ).rejects.toThrow(new RoleNotFoundError('role-foreign'));

    expect(await rolesOf(sut.userRepository)).toEqual([]);
  });
});
