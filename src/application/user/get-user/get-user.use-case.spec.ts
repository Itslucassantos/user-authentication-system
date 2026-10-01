import { makeUser } from '../../../@testing/builders.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import GetUserUseCase from './get-user.use-case.js';

describe('GetUserUseCase', () => {
  it('returns the public data of the user, without the password hash', async () => {
    const userRepository = new InMemoryUserRepository().seed(
      makeUser({ id: 'user-1', name: 'John Doe', email: 'john@example.com', active: true }),
    );

    const output = await new GetUserUseCase(userRepository).execute({ userId: 'user-1' });

    expect(output).toEqual({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      active: true,
    });
  });

  it('returns null when the user does not exist', async () => {
    const output = await new GetUserUseCase(new InMemoryUserRepository()).execute({
      userId: 'missing',
    });

    expect(output).toBeNull();
  });
});
