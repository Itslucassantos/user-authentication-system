import { makeRefreshToken } from '../../../@testing/builders.js';
import InMemoryRefreshTokenRepository from '../../../@testing/fakes/in-memory-refresh-token.repository.js';
import RefreshTokenNotFoundError from '../../../domain/auth/error/refresh-token-not-found-error.js';
import { sha256 } from '../../@shared/opaque-token.js';
import LogoutUseCase from './logout.use-case.js';

const RAW_TOKEN = 'raw-refresh-token';

const makeSut = () => {
  const refreshTokenRepository = new InMemoryRefreshTokenRepository();
  const useCase = new LogoutUseCase(refreshTokenRepository);
  return { useCase, refreshTokenRepository };
};

describe('LogoutUseCase', () => {
  it('deletes the session identified by the refresh token', async () => {
    const sut = makeSut();
    sut.refreshTokenRepository.seed(makeRefreshToken({ tokenHash: sha256(RAW_TOKEN) }));

    await sut.useCase.execute({ refreshToken: RAW_TOKEN });

    expect(sut.refreshTokenRepository.all()).toHaveLength(0);
  });

  it('keeps the other sessions of the same user', async () => {
    const sut = makeSut();
    sut.refreshTokenRepository.seed(
      makeRefreshToken({ userId: 'user-1', tokenHash: sha256(RAW_TOKEN) }),
      makeRefreshToken({ userId: 'user-1', tokenHash: sha256('other-device') }),
    );

    await sut.useCase.execute({ refreshToken: RAW_TOKEN });

    expect(sut.refreshTokenRepository.all()).toHaveLength(1);
  });

  it('is idempotent for an unknown token', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ refreshToken: 'unknown' })).resolves.toBeUndefined();
  });

  it('does nothing for an already revoked token', async () => {
    const sut = makeSut();
    sut.refreshTokenRepository.seed(
      makeRefreshToken({ tokenHash: sha256(RAW_TOKEN), revoked: true }),
    );
    const remove = jest.spyOn(sut.refreshTokenRepository, 'delete');

    await sut.useCase.execute({ refreshToken: RAW_TOKEN });

    expect(remove).not.toHaveBeenCalled();
  });

  it('tolerates the token vanishing between the lookup and the delete', async () => {
    const sut = makeSut();
    sut.refreshTokenRepository.seed(makeRefreshToken({ tokenHash: sha256(RAW_TOKEN) }));
    jest
      .spyOn(sut.refreshTokenRepository, 'delete')
      .mockRejectedValueOnce(new RefreshTokenNotFoundError());

    await expect(sut.useCase.execute({ refreshToken: RAW_TOKEN })).resolves.toBeUndefined();
  });

  it('does not swallow unexpected repository failures', async () => {
    const sut = makeSut();
    sut.refreshTokenRepository.seed(makeRefreshToken({ tokenHash: sha256(RAW_TOKEN) }));
    jest.spyOn(sut.refreshTokenRepository, 'delete').mockRejectedValueOnce(new Error('redis down'));

    await expect(sut.useCase.execute({ refreshToken: RAW_TOKEN })).rejects.toThrow('redis down');
  });
});
