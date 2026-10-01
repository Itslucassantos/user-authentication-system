import { makeUser } from '../../../@testing/builders.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import UpdateUserUseCase from './update-user.use-case.js';

const makeSut = () => {
  const userRepository = new InMemoryUserRepository().seed(
    makeUser({ id: 'user-1', name: 'John Doe', email: 'john@example.com' }),
  );
  return { useCase: new UpdateUserUseCase(userRepository), userRepository };
};

describe('UpdateUserUseCase', () => {
  it('renames the user, persists it and returns the public data', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ userId: 'user-1', name: 'Jane Doe' });

    expect(output).toEqual({
      id: 'user-1',
      name: 'Jane Doe',
      email: 'john@example.com',
      active: true,
    });
    expect((await sut.userRepository.findById('user-1'))?.name).toBe('Jane Doe');
  });

  it('rejects an empty name and keeps the stored user untouched', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ userId: 'user-1', name: '' })).rejects.toThrow(
      'Name is required',
    );

    expect((await sut.userRepository.findById('user-1'))?.name).toBe('John Doe');
  });

  it('fails when the user does not exist', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ userId: 'missing', name: 'Jane' })).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
