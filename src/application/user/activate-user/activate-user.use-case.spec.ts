import { makeUser } from '../../../@testing/builders.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import ActivateUserUseCase from './activate-user.use-case.js';

const makeSut = () => {
  const userRepository = new InMemoryUserRepository();
  return { useCase: new ActivateUserUseCase(userRepository), userRepository };
};

describe('ActivateUserUseCase', () => {
  it('activates and persists a user that already has a password', async () => {
    const sut = makeSut();
    sut.userRepository.seed(makeUser({ id: 'user-1', active: false }));

    await sut.useCase.execute({ userId: 'user-1' });

    expect((await sut.userRepository.findById('user-1'))?.active).toBe(true);
  });

  it('refuses to activate a user that has not set a password yet', async () => {
    const sut = makeSut();
    sut.userRepository.seed(makeUser({ id: 'user-1', passwordHash: null, active: false }));

    await expect(sut.useCase.execute({ userId: 'user-1' })).rejects.toThrow(
      'Password must be set before activating the user',
    );

    expect((await sut.userRepository.findById('user-1'))?.active).toBe(false);
  });

  it('fails when the user does not exist', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ userId: 'missing' })).rejects.toThrow(UserNotFoundError);
  });
});
