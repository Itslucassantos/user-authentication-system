import { makeUser } from '../../../@testing/builders.js';
import FakeEventDispatcher from '../../../@testing/fakes/fake-event-dispatcher.js';
import FakeRateLimiter from '../../../@testing/fakes/fake-rate-limiter.js';
import InMemoryPasswordTokenRepository from '../../../@testing/fakes/in-memory-password-token.repository.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import { PasswordTokenType } from '../../../domain/auth/enum/password-token-type.enum.js';
import PasswordResetRequestedEvent from '../../../domain/auth/event/password-reset-requested.event.js';
import { sha256 } from '../../@shared/opaque-token.js';
import TooManyRequestsError from '../../@shared/too-many-requests-error.js';
import RequestPasswordResetUseCase from './request-password-reset.use-case.js';

const makeSut = (maxHits?: number) => {
  const userRepository = new InMemoryUserRepository();
  const passwordTokenRepository = new InMemoryPasswordTokenRepository();
  const eventDispatcher = new FakeEventDispatcher();
  const rateLimiter = new FakeRateLimiter(maxHits);
  const useCase = new RequestPasswordResetUseCase(
    userRepository,
    passwordTokenRepository,
    eventDispatcher,
    rateLimiter,
  );
  return { useCase, userRepository, passwordTokenRepository, eventDispatcher, rateLimiter };
};

describe('RequestPasswordResetUseCase', () => {
  it('stores a reset token hash and announces the raw token through an event', async () => {
    const sut = makeSut();
    sut.userRepository.seed(makeUser({ id: 'user-1', email: 'john.doe@example.com' }));

    await sut.useCase.execute({ email: 'john.doe@example.com' });

    const [event] = sut.eventDispatcher.events as PasswordResetRequestedEvent[];
    expect(event).toBeInstanceOf(PasswordResetRequestedEvent);
    expect(event?.eventData).toEqual({
      userId: 'user-1',
      email: 'john.doe@example.com',
      resetToken: expect.stringMatching(/^[0-9a-f]{64}$/),
    });

    const stored = sut.passwordTokenRepository.all();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      userId: 'user-1',
      type: PasswordTokenType.PASSWORD_RESET,
      tokenHash: sha256(event!.eventData.resetToken),
      used: false,
    });
    expect(stored[0]?.isValid()).toBe(true);
  });

  it.each([
    ['an unknown e-mail', () => makeUser({ email: 'other@example.com' })],
    ['a deactivated user', () => makeUser({ email: 'john.doe@example.com', active: false })],
  ])(
    'silently does nothing for %s, so accounts cannot be enumerated',
    async (_label, makeTarget) => {
      const sut = makeSut();
      sut.userRepository.seed(makeTarget());

      await expect(sut.useCase.execute({ email: 'john.doe@example.com' })).resolves.toBeUndefined();

      expect(sut.passwordTokenRepository.all()).toHaveLength(0);
      expect(sut.eventDispatcher.events).toHaveLength(0);
    },
  );

  it('counts every request against the limiter, including those for unknown e-mails', async () => {
    const sut = makeSut();

    await sut.useCase.execute({ email: 'Nobody@Example.com' });

    expect(sut.rateLimiter.hitsFor('password-reset:nobody@example.com')).toBe(1);
  });

  it('is blocked once the limiter is exhausted, before touching any data', async () => {
    const sut = makeSut(2);
    sut.userRepository.seed(makeUser({ email: 'john.doe@example.com' }));
    await sut.useCase.execute({ email: 'john.doe@example.com' });
    await sut.useCase.execute({ email: 'john.doe@example.com' });

    await expect(sut.useCase.execute({ email: 'john.doe@example.com' })).rejects.toThrow(
      TooManyRequestsError,
    );

    expect(sut.passwordTokenRepository.all()).toHaveLength(2);
    expect(sut.eventDispatcher.events).toHaveLength(2);
  });

  it('rejects a malformed e-mail', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ email: 'invalid' })).rejects.toThrow('Invalid email format');
  });
});
