import RefreshTokenNotFoundError from '../../../domain/auth/error/refresh-token-not-found-error.js';
import type RefreshTokenRepositoryInterface from '../../../domain/auth/repository/refresh-token-repository.interface.js';
import { sha256 } from '../../@shared/opaque-token.js';
import type { LogoutInputDto } from './logout.dto.js';

export default class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepositoryInterface) {}

  async execute(input: LogoutInputDto): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findByTokenHash(
      sha256(input.refreshToken),
    );
    if (!refreshToken || refreshToken.revoked) return;

    try {
      await this.refreshTokenRepository.delete(refreshToken);
    } catch (error) {
      if (error instanceof RefreshTokenNotFoundError) return;
      throw error;
    }
  }
}
