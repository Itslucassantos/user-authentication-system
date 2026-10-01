import { makeUser } from '../../../@testing/builders.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import DeactivateUserUseCase from './deactivate-user.use-case.js';

const makeSut = () => {
  const userRepository = new InMemoryUserRepository();
  return { useCase: new DeactivateUserUseCase(userRepository), userRepository };
};

describe('DeactivateUserUseCase', () => {
  it('deactivates and persists the user', async () => {
    const sut = makeSut();
    sut.userRepository.seed(makeUser({ id: 'user-1', active: true }));

    await sut.useCase.execute({ userId: 'user-1' });

    expect((await sut.userRepository.findById('user-1'))?.active).toBe(false);
  });

  it('is idempotent for an already inactive user', async () => {
    const sut = makeSut();
    sut.userRepository.seed(makeUser({ id: 'user-1', active: false }));

    await expect(sut.useCase.execute({ userId: 'user-1' })).resolves.toBeUndefined();
  });

  it('fails when the user does not exist', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ userId: 'missing' })).rejects.toThrow(UserNotFoundError);
  });
});
