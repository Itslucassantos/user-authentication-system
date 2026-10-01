import { makePasswordToken, makeRefreshToken, makeUser } from '../../../@testing/builders.js';
import FakeHasher from '../../../@testing/fakes/fake-hasher.js';
import FakeRateLimiter from '../../../@testing/fakes/fake-rate-limiter.js';
import InMemoryPasswordTokenRepository from '../../../@testing/fakes/in-memory-password-token.repository.js';
import InMemoryRefreshTokenRepository from '../../../@testing/fakes/in-memory-refresh-token.repository.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import { PasswordTokenType } from '../../../domain/auth/enum/password-token-type.enum.js';
import { sha256 } from '../../@shared/opaque-token.js';
import TooManyRequestsError from '../../@shared/too-many-requests-error.js';
import type { SetPasswordInputDto } from './set-password.dto.js';
import SetPasswordUseCase from './set-password.use-case.js';

const RAW_TOKEN = 'raw-token';
const RATE_LIMIT_KEY = 'set-password:10.0.0.1';

const makeInput = (overrides: Partial<SetPasswordInputDto> = {}): SetPasswordInputDto => ({
  token: RAW_TOKEN,
  newPassword: 'NewSecret123',
  ipAddress: '10.0.0.1',
  ...overrides,
});

const makeSut = (maxHits?: number) => {
  const userRepository = new InMemoryUserRepository();
  const passwordTokenRepository = new InMemoryPasswordTokenRepository();
  const refreshTokenRepository = new InMemoryRefreshTokenRepository();
  const hasher = new FakeHasher();
  const rateLimiter = new FakeRateLimiter(maxHits);
  const useCase = new SetPasswordUseCase(
    userRepository,
    passwordTokenRepository,
    refreshTokenRepository,
    hasher,
    rateLimiter,
  );
  return { useCase, userRepository, passwordTokenRepository, refreshTokenRepository, rateLimiter };
};

const seedInvitedUser = (sut: ReturnType<typeof makeSut>) => {
  sut.userRepository.seed(makeUser({ id: 'user-1', passwordHash: null, active: false }));
  sut.passwordTokenRepository.seed(
    makePasswordToken({
      userId: 'user-1',
      type: PasswordTokenType.INVITATION,
      tokenHash: sha256(RAW_TOKEN),
    }),
  );
};

describe('SetPasswordUseCase', () => {
  describe('accepting an invitation', () => {
    it('hashes the password and activates the user', async () => {
      const sut = makeSut();
      seedInvitedUser(sut);

      await sut.useCase.execute(makeInput());

      const user = await sut.userRepository.findById('user-1');
      expect(user?.passwordHash).toBe('hashed:NewSecret123');
      expect(user?.active).toBe(true);
    });

    it('consumes the token so it cannot be used twice', async () => {
      const sut = makeSut();
      seedInvitedUser(sut);

      await sut.useCase.execute(makeInput());

      expect(sut.passwordTokenRepository.all()[0]?.used).toBe(true);
      await expect(sut.useCase.execute(makeInput())).rejects.toThrow(
        'Password token is expired or already used',
      );
    });
  });

  describe('resetting a password', () => {
    it('changes the password without altering the active flag', async () => {
      const sut = makeSut();
      sut.userRepository.seed(
        makeUser({ id: 'user-1', passwordHash: 'hashed:OldSecret123', active: false }),
      );
      sut.passwordTokenRepository.seed(
        makePasswordToken({
          userId: 'user-1',
          type: PasswordTokenType.PASSWORD_RESET,
          tokenHash: sha256(RAW_TOKEN),
        }),
      );

      await sut.useCase.execute(makeInput());

      const user = await sut.userRepository.findById('user-1');
      expect(user?.passwordHash).toBe('hashed:NewSecret123');
      expect(user?.active).toBe(false);
    });

    it('revokes every session of that user, leaving other users untouched', async () => {
      const sut = makeSut();
      sut.userRepository.seed(makeUser({ id: 'user-1' }));
      sut.passwordTokenRepository.seed(
        makePasswordToken({ userId: 'user-1', tokenHash: sha256(RAW_TOKEN) }),
      );
      sut.refreshTokenRepository.seed(
        makeRefreshToken({ userId: 'user-1', tokenHash: 'phone' }),
        makeRefreshToken({ userId: 'user-1', tokenHash: 'laptop' }),
        makeRefreshToken({ userId: 'user-2', tokenHash: 'other-user' }),
      );

      await sut.useCase.execute(makeInput());

      expect(sut.refreshTokenRepository.all().map((token) => token.tokenHash)).toEqual([
        'other-user',
      ]);
    });
  });

  describe('validation', () => {
    it('rejects a weak password before touching the token or the limiter', async () => {
      const sut = makeSut();
      seedInvitedUser(sut);

      await expect(sut.useCase.execute(makeInput({ newPassword: 'weak' }))).rejects.toThrow(
        'Password must be at least 8 characters long',
      );

      expect(sut.rateLimiter.hitsFor(RATE_LIMIT_KEY)).toBe(0);
      expect(sut.passwordTokenRepository.all()[0]?.used).toBe(false);
    });

    it('rejects an unknown token and counts the attempt', async () => {
      const sut = makeSut();

      await expect(sut.useCase.execute(makeInput({ token: 'unknown' }))).rejects.toThrow(
        'Password token not found',
      );

      expect(sut.rateLimiter.hitsFor(RATE_LIMIT_KEY)).toBe(1);
    });

    it.each([
      ['an expired token', { expiresAt: new Date(Date.now() - 1000) }],
      ['an already used token', { used: true }],
    ])('rejects %s and counts the attempt', async (_label, tokenOverrides) => {
      const sut = makeSut();
      sut.userRepository.seed(makeUser({ id: 'user-1' }));
      sut.passwordTokenRepository.seed(
        makePasswordToken({ userId: 'user-1', tokenHash: sha256(RAW_TOKEN), ...tokenOverrides }),
      );

      await expect(sut.useCase.execute(makeInput())).rejects.toThrow(
        'Password token is expired or already used',
      );

      expect(sut.rateLimiter.hitsFor(RATE_LIMIT_KEY)).toBe(1);
      expect((await sut.userRepository.findById('user-1'))?.passwordHash).toBe('hashed:Secret123');
    });

    it('fails when the owner of the token no longer exists', async () => {
      const sut = makeSut();
      sut.passwordTokenRepository.seed(
        makePasswordToken({ userId: 'ghost', tokenHash: sha256(RAW_TOKEN) }),
      );

      await expect(sut.useCase.execute(makeInput())).rejects.toThrow('User not found');
      expect(sut.passwordTokenRepository.all()[0]?.used).toBe(false);
    });
  });

  describe('rate limiting', () => {
    it('blocks the IP after too many failed attempts, even for a valid token', async () => {
      const sut = makeSut(2);
      seedInvitedUser(sut);
      await sut.useCase.execute(makeInput({ token: 'guess-1' })).catch(() => undefined);
      await sut.useCase.execute(makeInput({ token: 'guess-2' })).catch(() => undefined);

      await expect(sut.useCase.execute(makeInput())).rejects.toThrow(TooManyRequestsError);

      expect((await sut.userRepository.findById('user-1'))?.passwordHash).toBeNull();
    });

    it('tracks each IP independently', async () => {
      const sut = makeSut(1);
      seedInvitedUser(sut);
      await sut.useCase.execute(makeInput({ token: 'guess' })).catch(() => undefined);

      await expect(
        sut.useCase.execute(makeInput({ ipAddress: '10.0.0.2' })),
      ).resolves.toBeUndefined();
    });
  });
});
