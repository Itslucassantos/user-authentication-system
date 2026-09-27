import type HasherInterface from '../../@shared/hasher.interface.js';
import type RateLimiterInterface from '../../@shared/rate-limiter.interface.js';
import { PasswordTokenType } from '../../../domain/auth/enum/password-token-type.enum.js';
import type PasswordTokenRepositoryInterface from '../../../domain/auth/repository/password-token-repository.interface.js';
import type RefreshTokenRepositoryInterface from '../../../domain/auth/repository/refresh-token-repository.interface.js';
import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import { sha256 } from '../../@shared/opaque-token.js';
import type { SetPasswordInputDto } from './set-password.dto.js';

export default class SetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly passwordTokenRepository: PasswordTokenRepositoryInterface,
    private readonly refreshTokenRepository: RefreshTokenRepositoryInterface,
    private readonly hasher: HasherInterface,
    private readonly rateLimiter: RateLimiterInterface,
  ) {}

  async execute(input: SetPasswordInputDto): Promise<void> {
    const { token, newPassword, ipAddress } = input;
    const rateLimitKey = `set-password:${ipAddress}`;
    await this.rateLimiter.ensureNotBlocked(rateLimitKey);

    const tokenHash = sha256(token);

    const passwordToken = await this.passwordTokenRepository.findByTokenHash(tokenHash);
    if (!passwordToken) {
      await this.rateLimiter.hit(rateLimitKey);
      throw new Error('Password token not found');
    }
    if (!passwordToken.isValid()) {
      await this.rateLimiter.hit(rateLimitKey);
      throw new Error('Password token is expired or already used');
    }

    const user = await this.userRepository.findById(passwordToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const passwordHash = await this.hasher.hash(newPassword);
    user.setPasswordHash(passwordHash);
    if (passwordToken.type === PasswordTokenType.INVITATION) {
      user.activate();
    }
    await this.userRepository.update(user);

    passwordToken.markUsed();
    await this.passwordTokenRepository.update(passwordToken);

    await this.refreshTokenRepository.deleteAllByUserId(user.id);
  }
}
