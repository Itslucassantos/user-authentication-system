import {
  CLIENT_APPLICATION_ID,
  OTHER_CLIENT_APPLICATION_ID,
  makeClientApplication,
  makePermission,
  makeRole,
  makeUser,
} from '../../../@testing/builders.js';
import FakeHasher from '../../../@testing/fakes/fake-hasher.js';
import FakeRateLimiter from '../../../@testing/fakes/fake-rate-limiter.js';
import FakeTokenService from '../../../@testing/fakes/fake-token-service.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import InMemoryRefreshTokenRepository from '../../../@testing/fakes/in-memory-refresh-token.repository.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import InvalidClientError from '../../../domain/auth/error/invalid-client-error.js';
import InvalidCredentialsError from '../../../domain/auth/error/invalid-credentials-error.js';
import { sha256 } from '../../@shared/opaque-token.js';
import TooManyRequestsError from '../../@shared/too-many-requests-error.js';
import type { LoginInputDto } from './login.dto.js';
import LoginUseCase from './login.use-case.js';

const PASSWORD = 'Secret123';

const makeInput = (overrides: Partial<LoginInputDto> = {}): LoginInputDto => ({
  email: 'john.doe@example.com',
  password: PASSWORD,
  clientId: 'client-id-1',
  deviceInfo: 'Firefox on Linux',
  ipAddress: '10.0.0.1',
  ...overrides,
});

const makeSut = (maxHits?: { user?: number; ip?: number }) => {
  const userRepository = new InMemoryUserRepository();
  const clientApplicationRepository = new InMemoryClientApplicationRepository();
  const refreshTokenRepository = new InMemoryRefreshTokenRepository();
  const hasher = new FakeHasher();
  const tokenService = new FakeTokenService();
  const rateLimiter = new FakeRateLimiter(maxHits?.user);
  const ipRateLimiter = new FakeRateLimiter(maxHits?.ip);
  const useCase = new LoginUseCase(
    userRepository,
    clientApplicationRepository,
    refreshTokenRepository,
    hasher,
    tokenService,
    rateLimiter,
    ipRateLimiter,
  );

  clientApplicationRepository.seed(makeClientApplication());

  return {
    useCase,
    userRepository,
    clientApplicationRepository,
    refreshTokenRepository,
    hasher,
    tokenService,
    rateLimiter,
    ipRateLimiter,
  };
};

describe('LoginUseCase', () => {
  describe('successful login', () => {
    it('returns the tokens and the public user data', async () => {
      const sut = makeSut();
      sut.userRepository.seed(
        makeUser({
          id: 'user-1',
          name: 'John Doe',
          passwordHash: await sut.hasher.hash(PASSWORD),
        }),
      );

      const output = await sut.useCase.execute(makeInput());

      expect(output).toEqual({
        accessToken: 'access-token-1',
        refreshToken: expect.stringMatching(/^[0-9a-f]{64}$/),
        user: { id: 'user-1', name: 'John Doe', email: 'john.doe@example.com', active: true },
      });
    });

    it('signs an access token scoped to the roles and permissions of the client application', async () => {
      const sut = makeSut();
      const ownRole = makeRole({
        name: 'admin',
        permissions: [makePermission({ resource: 'users', action: 'read' })],
      });
      const foreignRole = makeRole({
        name: 'foreign',
        clientApplicationId: OTHER_CLIENT_APPLICATION_ID,
        permissions: [makePermission({ clientApplicationId: OTHER_CLIENT_APPLICATION_ID })],
      });
      sut.userRepository.seed(
        makeUser({
          id: 'user-1',
          passwordHash: await sut.hasher.hash(PASSWORD),
          roles: [ownRole, foreignRole],
        }),
      );

      await sut.useCase.execute(makeInput());

      expect(sut.tokenService.signedPayloads).toEqual([
        {
          sub: 'user-1',
          clientApplicationId: CLIENT_APPLICATION_ID,
          roles: ['admin'],
          permissions: ['users:read'],
        },
      ]);
    });

    it('persists only the hash of the refresh token, bound to the user, client and device', async () => {
      const sut = makeSut();
      sut.userRepository.seed(
        makeUser({ id: 'user-1', passwordHash: await sut.hasher.hash(PASSWORD) }),
      );

      const { refreshToken } = await sut.useCase.execute(makeInput());

      const stored = sut.refreshTokenRepository.all();
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        userId: 'user-1',
        clientApplicationId: CLIENT_APPLICATION_ID,
        deviceInfo: 'Firefox on Linux',
        tokenHash: sha256(refreshToken),
        revoked: false,
      });
      expect(stored[0]?.tokenHash).not.toBe(refreshToken);
    });

    it('resets the per-user failure counter but not the per-IP one', async () => {
      const sut = makeSut();
      sut.userRepository.seed(makeUser({ passwordHash: await sut.hasher.hash(PASSWORD) }));
      await sut.rateLimiter.hit('login:john.doe@example.com');
      await sut.ipRateLimiter.hit('login-ip:10.0.0.1');

      await sut.useCase.execute(makeInput());

      expect(sut.rateLimiter.hitsFor('login:john.doe@example.com')).toBe(0);
      expect(sut.ipRateLimiter.hitsFor('login-ip:10.0.0.1')).toBe(1);
    });

    it('issues an independent session on every login', async () => {
      const sut = makeSut();
      sut.userRepository.seed(makeUser({ passwordHash: await sut.hasher.hash(PASSWORD) }));

      const first = await sut.useCase.execute(makeInput({ deviceInfo: 'Phone' }));
      const second = await sut.useCase.execute(makeInput({ deviceInfo: 'Laptop' }));

      expect(first.refreshToken).not.toBe(second.refreshToken);
      expect(sut.refreshTokenRepository.all()).toHaveLength(2);
    });
  });

  describe('client application validation', () => {
    it('rejects an unknown client', async () => {
      const sut = makeSut();

      await expect(sut.useCase.execute(makeInput({ clientId: 'unknown' }))).rejects.toThrow(
        InvalidClientError,
      );
    });

    it('rejects an inactive client', async () => {
      const sut = makeSut();
      sut.clientApplicationRepository.seed(makeClientApplication({ active: false }));
      sut.userRepository.seed(makeUser({ passwordHash: await sut.hasher.hash(PASSWORD) }));

      await expect(sut.useCase.execute(makeInput())).rejects.toThrow(InvalidClientError);
      expect(sut.refreshTokenRepository.all()).toHaveLength(0);
    });
  });

  describe('invalid credentials', () => {
    it.each([
      ['a wrong password', makeInput({ password: 'Wrong123' }), {}],
      ['an unknown user', makeInput({ email: 'nobody@example.com' }), {}],
      ['an inactive user', makeInput(), { active: false }],
      [
        'a user that has not set a password yet',
        makeInput(),
        { passwordHash: null, active: false },
      ],
    ])('answers %s with the same generic error', async (_label, input, userOverrides) => {
      const sut = makeSut();
      sut.userRepository.seed(
        makeUser({ passwordHash: await sut.hasher.hash(PASSWORD), ...userOverrides }),
      );

      await expect(sut.useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
      expect(sut.tokenService.signedPayloads).toHaveLength(0);
      expect(sut.refreshTokenRepository.all()).toHaveLength(0);
    });

    it('counts the failure against both the user and the IP', async () => {
      const sut = makeSut();
      sut.userRepository.seed(makeUser({ passwordHash: await sut.hasher.hash(PASSWORD) }));

      await expect(sut.useCase.execute(makeInput({ password: 'Wrong123' }))).rejects.toThrow(
        InvalidCredentialsError,
      );

      expect(sut.rateLimiter.hitsFor('login:john.doe@example.com')).toBe(1);
      expect(sut.ipRateLimiter.hitsFor('login-ip:10.0.0.1')).toBe(1);
    });

    it('counts attempts against unknown users too, so accounts cannot be enumerated', async () => {
      const sut = makeSut();

      await expect(sut.useCase.execute(makeInput({ email: 'nobody@example.com' }))).rejects.toThrow(
        InvalidCredentialsError,
      );

      expect(sut.rateLimiter.hitsFor('login:nobody@example.com')).toBe(1);
    });

    it('normalizes the e-mail so casing cannot be used to dodge the limiter', async () => {
      const sut = makeSut();

      await expect(sut.useCase.execute(makeInput({ email: 'Nobody@Example.com' }))).rejects.toThrow(
        InvalidCredentialsError,
      );

      expect(sut.rateLimiter.hitsFor('login:nobody@example.com')).toBe(1);
    });

    it('does not even compare the password of an inactive user', async () => {
      const sut = makeSut();
      sut.userRepository.seed(
        makeUser({ passwordHash: await sut.hasher.hash(PASSWORD), active: false }),
      );
      const compare = jest.spyOn(sut.hasher, 'compare');

      await expect(sut.useCase.execute(makeInput())).rejects.toThrow(InvalidCredentialsError);

      expect(compare).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('blocks the attempt when the user limiter is exhausted, without touching credentials', async () => {
      const sut = makeSut({ user: 1 });
      sut.userRepository.seed(makeUser({ passwordHash: await sut.hasher.hash(PASSWORD) }));
      await sut.rateLimiter.hit('login:john.doe@example.com');
      const compare = jest.spyOn(sut.hasher, 'compare');

      await expect(sut.useCase.execute(makeInput())).rejects.toThrow(TooManyRequestsError);

      expect(compare).not.toHaveBeenCalled();
      expect(sut.refreshTokenRepository.all()).toHaveLength(0);
    });

    it('blocks the attempt when the IP limiter is exhausted', async () => {
      const sut = makeSut({ ip: 1 });
      sut.userRepository.seed(makeUser({ passwordHash: await sut.hasher.hash(PASSWORD) }));
      await sut.ipRateLimiter.hit('login-ip:10.0.0.1');

      await expect(sut.useCase.execute(makeInput())).rejects.toThrow(TooManyRequestsError);
      expect(sut.tokenService.signedPayloads).toHaveLength(0);
    });

    it('locks the account after repeated failures, even with the right password', async () => {
      const sut = makeSut({ user: 3 });
      sut.userRepository.seed(makeUser({ passwordHash: await sut.hasher.hash(PASSWORD) }));

      for (let attempt = 0; attempt < 3; attempt++) {
        await expect(sut.useCase.execute(makeInput({ password: 'Wrong123' }))).rejects.toThrow(
          InvalidCredentialsError,
        );
      }

      await expect(sut.useCase.execute(makeInput())).rejects.toThrow(TooManyRequestsError);
    });
  });

  it('rejects a malformed e-mail before any rate-limit bookkeeping', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute(makeInput({ email: 'not-an-email' }))).rejects.toThrow(
      'Invalid email format',
    );
    expect(sut.rateLimiter.hitsFor('login:not-an-email')).toBe(0);
  });
});
