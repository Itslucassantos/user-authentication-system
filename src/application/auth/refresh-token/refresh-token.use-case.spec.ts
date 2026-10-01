import {
  CLIENT_APPLICATION_ID,
  makeClientApplication,
  makeRefreshToken,
  makeUser,
} from '../../../@testing/builders.js';
import FakeTokenService from '../../../@testing/fakes/fake-token-service.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import InMemoryRefreshTokenRepository from '../../../@testing/fakes/in-memory-refresh-token.repository.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import InvalidRefreshTokenError from '../../../domain/auth/error/invalid-refresh-token-error.js';
import RefreshTokenNotFoundError from '../../../domain/auth/error/refresh-token-not-found-error.js';
import { sha256 } from '../../@shared/opaque-token.js';
import RefreshTokenUseCase from './refresh-token.use-case.js';

const RAW_TOKEN = 'raw-refresh-token';

const makeSut = () => {
  const refreshTokenRepository = new InMemoryRefreshTokenRepository();
  const userRepository = new InMemoryUserRepository();
  const clientApplicationRepository = new InMemoryClientApplicationRepository();
  const tokenService = new FakeTokenService();
  const useCase = new RefreshTokenUseCase(
    refreshTokenRepository,
    userRepository,
    clientApplicationRepository,
    tokenService,
  );

  userRepository.seed(makeUser({ id: 'user-1' }));
  clientApplicationRepository.seed(makeClientApplication());
  refreshTokenRepository.seed(
    makeRefreshToken({
      userId: 'user-1',
      tokenHash: sha256(RAW_TOKEN),
      deviceInfo: 'Firefox on Linux',
    }),
  );

  return {
    useCase,
    refreshTokenRepository,
    userRepository,
    clientApplicationRepository,
    tokenService,
  };
};

describe('RefreshTokenUseCase', () => {
  describe('successful rotation', () => {
    it('returns a new token pair for the same user', async () => {
      const sut = makeSut();

      const output = await sut.useCase.execute({ refreshToken: RAW_TOKEN });

      expect(output.accessToken).toBe('access-token-1');
      expect(output.refreshToken).toMatch(/^[0-9a-f]{64}$/);
      expect(output.refreshToken).not.toBe(RAW_TOKEN);
      expect(output.user.id).toBe('user-1');
    });

    it('revokes the used token and stores the new one with the same device info', async () => {
      const sut = makeSut();

      const { refreshToken } = await sut.useCase.execute({ refreshToken: RAW_TOKEN });

      const old = await sut.refreshTokenRepository.findByTokenHash(sha256(RAW_TOKEN));
      const rotated = await sut.refreshTokenRepository.findByTokenHash(sha256(refreshToken));
      expect(old?.revoked).toBe(true);
      expect(rotated).toMatchObject({
        userId: 'user-1',
        clientApplicationId: CLIENT_APPLICATION_ID,
        deviceInfo: 'Firefox on Linux',
        revoked: false,
      });
    });

    it('cannot be replayed: the second use of the same token fails', async () => {
      const sut = makeSut();
      await sut.useCase.execute({ refreshToken: RAW_TOKEN });

      await expect(sut.useCase.execute({ refreshToken: RAW_TOKEN })).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });
  });

  describe('reuse detection', () => {
    it('revokes every session of the user when a revoked token is presented', async () => {
      const sut = makeSut();
      const { refreshToken: rotated } = await sut.useCase.execute({ refreshToken: RAW_TOKEN });
      sut.refreshTokenRepository.seed(
        makeRefreshToken({ userId: 'someone-else', tokenHash: 'other' }),
      );

      await expect(sut.useCase.execute({ refreshToken: RAW_TOKEN })).rejects.toThrow(
        InvalidRefreshTokenError,
      );

      expect(await sut.refreshTokenRepository.findByTokenHash(sha256(rotated))).toBeNull();
      expect(await sut.refreshTokenRepository.findByTokenHash('other')).not.toBeNull();
    });
  });

  describe('invalid tokens', () => {
    it('rejects an unknown token', async () => {
      const sut = makeSut();

      await expect(sut.useCase.execute({ refreshToken: 'unknown' })).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });

    it('rejects an expired token', async () => {
      const sut = makeSut();
      sut.refreshTokenRepository.seed(
        makeRefreshToken({
          tokenHash: sha256('expired'),
          expiresAt: new Date(Date.now() - 1000),
        }),
      );

      await expect(sut.useCase.execute({ refreshToken: 'expired' })).rejects.toThrow(
        InvalidRefreshTokenError,
      );
      expect(sut.tokenService.signedPayloads).toHaveLength(0);
    });

    it('translates the lost concurrent-rotation race into an invalid token error', async () => {
      const sut = makeSut();
      jest
        .spyOn(sut.refreshTokenRepository, 'update')
        .mockRejectedValueOnce(new RefreshTokenNotFoundError());

      await expect(sut.useCase.execute({ refreshToken: RAW_TOKEN })).rejects.toThrow(
        InvalidRefreshTokenError,
      );
      expect(sut.tokenService.signedPayloads).toHaveLength(0);
    });

    it('does not swallow unexpected repository failures', async () => {
      const sut = makeSut();
      jest
        .spyOn(sut.refreshTokenRepository, 'update')
        .mockRejectedValueOnce(new Error('redis down'));

      await expect(sut.useCase.execute({ refreshToken: RAW_TOKEN })).rejects.toThrow('redis down');
    });
  });

  describe('owner and client validation', () => {
    it('rejects when the user no longer exists', async () => {
      const sut = makeSut();
      await sut.userRepository.delete('user-1');

      await expect(sut.useCase.execute({ refreshToken: RAW_TOKEN })).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });

    it('rejects when the user was deactivated', async () => {
      const sut = makeSut();
      sut.userRepository.seed(makeUser({ id: 'user-1', active: false }));

      await expect(sut.useCase.execute({ refreshToken: RAW_TOKEN })).rejects.toThrow(
        InvalidRefreshTokenError,
      );
      expect(sut.tokenService.signedPayloads).toHaveLength(0);
    });

    it('rejects when the client application no longer exists', async () => {
      const sut = makeSut();
      await sut.clientApplicationRepository.delete(CLIENT_APPLICATION_ID);

      await expect(sut.useCase.execute({ refreshToken: RAW_TOKEN })).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });

    it('rejects when the client application was deactivated', async () => {
      const sut = makeSut();
      sut.clientApplicationRepository.seed(makeClientApplication({ active: false }));

      await expect(sut.useCase.execute({ refreshToken: RAW_TOKEN })).rejects.toThrow(
        InvalidRefreshTokenError,
      );
    });
  });
});
