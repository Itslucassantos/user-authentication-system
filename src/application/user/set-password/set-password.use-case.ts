import type HasherInterface from '../../@shared/hasher.interface.js';
import type PasswordTokenRepositoryInterface from '../../../domain/auth/repository/password-token-repository.interface.js';
import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import { sha256 } from '../../@shared/opaque-token.js';
import type { SetPasswordInputDto } from './set-password.dto.js';

export default class SetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly passwordTokenRepository: PasswordTokenRepositoryInterface,
    private readonly hasher: HasherInterface,
  ) {}

  async execute(input: SetPasswordInputDto): Promise<void> {
    const { token, newPassword } = input;
    const tokenHash = sha256(token);

    const passwordToken = await this.passwordTokenRepository.findByTokenHash(tokenHash);
    if (!passwordToken) {
      throw new Error('Password token not found');
    }
    if (!passwordToken.isValid()) {
      throw new Error('Password token is expired or already used');
    }

    const user = await this.userRepository.findById(passwordToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const passwordHash = await this.hasher.hash(newPassword);
    user.setPasswordHash(passwordHash);
    user.activate();
    await this.userRepository.update(user);

    passwordToken.markUsed();
    await this.passwordTokenRepository.update(passwordToken);
  }
}
