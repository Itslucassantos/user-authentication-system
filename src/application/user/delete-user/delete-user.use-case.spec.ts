import { makeUser } from '../../../@testing/builders.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import DeleteUserUseCase from './delete-user.use-case.js';

describe('DeleteUserUseCase', () => {
  it('removes only the requested user', async () => {
    const userRepository = new InMemoryUserRepository().seed(
      makeUser({ id: 'user-1', email: 'one@example.com' }),
      makeUser({ id: 'user-2', email: 'two@example.com' }),
    );

    await new DeleteUserUseCase(userRepository).execute({ userId: 'user-1' });

    expect(userRepository.all().map((user) => user.id)).toEqual(['user-2']);
  });

  it('propagates the not found error raised by the repository', async () => {
    const useCase = new DeleteUserUseCase(new InMemoryUserRepository());

    await expect(useCase.execute({ userId: 'missing' })).rejects.toThrow(UserNotFoundError);
  });
});
