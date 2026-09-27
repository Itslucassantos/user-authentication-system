import InvalidRefreshTokenError from '../../../domain/auth/error/invalid-refresh-token-error.js';
import RefreshTokenNotFoundError from '../../../domain/auth/error/refresh-token-not-found-error.js';
import RefreshTokenFactory from '../../../domain/auth/factory/refresh-token.factory.js';
import type RefreshTokenRepositoryInterface from '../../../domain/auth/repository/refresh-token-repository.interface.js';
import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import { generateOpaqueToken, sha256 } from '../../@shared/opaque-token.js';
import type TokenServiceInterface from '../../@shared/token-service.interface.js';
import {
  toAccessTokenPayload,
  toAuthPayloadOutputDto,
} from '../@shared/auth-payload-output.dto.js';
import type { RefreshTokenInputDto, RefreshTokenOutputDto } from './refresh-token.dto.js';

export default class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepositoryInterface,
    private readonly userRepository: UserRepositoryInterface,
    private readonly clientApplicationRepository: ClientApplicationRepositoryInterface,
    private readonly tokenService: TokenServiceInterface,
  ) {}

  async execute(input: RefreshTokenInputDto): Promise<RefreshTokenOutputDto> {
    const currentToken = await this.refreshTokenRepository.findByTokenHash(
      sha256(input.refreshToken),
    );
    if (!currentToken) throw new InvalidRefreshTokenError();

    if (currentToken.revoked) {
      await this.refreshTokenRepository.deleteAllByUserId(currentToken.userId);
      throw new InvalidRefreshTokenError();
    }
    if (!currentToken.isValid()) throw new InvalidRefreshTokenError();

    currentToken.revoke();
    try {
      await this.refreshTokenRepository.update(currentToken);
    } catch (error) {
      if (error instanceof RefreshTokenNotFoundError) throw new InvalidRefreshTokenError();
      throw error;
    }

    const [user, clientApplication] = await Promise.all([
      this.userRepository.findById(currentToken.userId),
      this.clientApplicationRepository.findById(currentToken.clientApplicationId),
    ]);
    if (!user || !user.active || !clientApplication || !clientApplication.active) {
      throw new InvalidRefreshTokenError();
    }

    const accessToken = await this.tokenService.signAccessToken(
      toAccessTokenPayload(user, clientApplication.id),
    );

    const refreshToken = generateOpaqueToken();
    await this.refreshTokenRepository.save(
      RefreshTokenFactory.create(
        user.id,
        clientApplication.id,
        sha256(refreshToken),
        currentToken.deviceInfo,
      ),
    );

    return toAuthPayloadOutputDto(user, accessToken, refreshToken);
  }
}
