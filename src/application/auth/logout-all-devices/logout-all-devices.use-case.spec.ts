import { makeRefreshToken } from '../../../@testing/builders.js';
import InMemoryRefreshTokenRepository from '../../../@testing/fakes/in-memory-refresh-token.repository.js';
import LogoutAllDevicesUseCase from './logout-all-devices.use-case.js';

describe('LogoutAllDevicesUseCase', () => {
  it('deletes every session of the user and only theirs', async () => {
    const refreshTokenRepository = new InMemoryRefreshTokenRepository().seed(
      makeRefreshToken({ userId: 'user-1', tokenHash: 'phone' }),
      makeRefreshToken({ userId: 'user-1', tokenHash: 'laptop' }),
      makeRefreshToken({ userId: 'user-2', tokenHash: 'other-user' }),
    );
    const useCase = new LogoutAllDevicesUseCase(refreshTokenRepository);

    await useCase.execute({ userId: 'user-1' });

    expect(refreshTokenRepository.all().map((token) => token.tokenHash)).toEqual(['other-user']);
  });

  it('succeeds when the user has no sessions', async () => {
    const useCase = new LogoutAllDevicesUseCase(new InMemoryRefreshTokenRepository());

    await expect(useCase.execute({ userId: 'user-1' })).resolves.toBeUndefined();
  });
});
