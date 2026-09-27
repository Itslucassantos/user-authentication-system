import type EventDispatcherInterface from '../../../domain/@shared/event/event-dispatcher.interface.js';
import PasswordResetRequestedEvent from '../../../domain/auth/event/password-reset-requested.event.js';
import PasswordTokenFactory from '../../../domain/auth/factory/password-token.factory.js';
import type PasswordTokenRepositoryInterface from '../../../domain/auth/repository/password-token-repository.interface.js';
import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import Email from '../../../domain/user/value-object/email.js';
import { generateOpaqueToken, sha256 } from '../../@shared/opaque-token.js';
import type RateLimiterInterface from '../../@shared/rate-limiter.interface.js';
import type { RequestPasswordResetInputDto } from './request-password-reset.dto.js';

export default class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly passwordTokenRepository: PasswordTokenRepositoryInterface,
    private readonly eventDispatcher: EventDispatcherInterface,
    private readonly rateLimiter: RateLimiterInterface,
  ) {}

  async execute(input: RequestPasswordResetInputDto): Promise<void> {
    const email = new Email(input.email);
    const rateLimitKey = `password-reset:${email.value.toLowerCase()}`;
    await this.rateLimiter.ensureNotBlocked(rateLimitKey);
    await this.rateLimiter.hit(rateLimitKey);

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.active) return;

    const resetToken = generateOpaqueToken();
    await this.passwordTokenRepository.save(
      PasswordTokenFactory.createPasswordReset(user.id, sha256(resetToken)),
    );

    await this.eventDispatcher.notify(
      new PasswordResetRequestedEvent({ userId: user.id, email: email.value, resetToken }),
    );
  }
}
