import InvalidClientError from '../../../domain/auth/error/invalid-client-error.js';
import InvalidCredentialsError from '../../../domain/auth/error/invalid-credentials-error.js';
import RefreshTokenFactory from '../../../domain/auth/factory/refresh-token.factory.js';
import type RefreshTokenRepositoryInterface from '../../../domain/auth/repository/refresh-token-repository.interface.js';
import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import Email from '../../../domain/user/value-object/email.js';
import type HasherInterface from '../../@shared/hasher.interface.js';
import type RateLimiterInterface from '../../@shared/rate-limiter.interface.js';
import { generateOpaqueToken, sha256 } from '../../@shared/opaque-token.js';
import type TokenServiceInterface from '../../@shared/token-service.interface.js';
import {
  toAccessTokenPayload,
  toAuthPayloadOutputDto,
} from '../@shared/auth-payload-output.dto.js';
import type { LoginInputDto, LoginOutputDto } from './login.dto.js';

export default class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly clientApplicationRepository: ClientApplicationRepositoryInterface,
    private readonly refreshTokenRepository: RefreshTokenRepositoryInterface,
    private readonly hasher: HasherInterface,
    private readonly tokenService: TokenServiceInterface,
    private readonly rateLimiter: RateLimiterInterface,
  ) {}

  async execute(input: LoginInputDto): Promise<LoginOutputDto> {
    const { password, clientId, deviceInfo } = input;

    const clientApplication = await this.clientApplicationRepository.findByClientId(clientId);
    if (!clientApplication || !clientApplication.active) throw new InvalidClientError(clientId);

    const email = new Email(input.email);
    const rateLimitKey = `login:${email.value.toLowerCase()}`;
    await this.rateLimiter.ensureNotBlocked(rateLimitKey);

    const user = await this.userRepository.findByEmail(email);
    const passwordMatches =
      !!user?.passwordHash &&
      user.active &&
      (await this.hasher.compare(password, user.passwordHash));
    if (!user || !passwordMatches) {
      await this.rateLimiter.hit(rateLimitKey);
      throw new InvalidCredentialsError();
    }
    await this.rateLimiter.reset(rateLimitKey);

    const accessToken = await this.tokenService.signAccessToken(
      toAccessTokenPayload(user, clientApplication.id),
    );

    const refreshToken = generateOpaqueToken();
    await this.refreshTokenRepository.save(
      RefreshTokenFactory.create(user.id, clientApplication.id, sha256(refreshToken), deviceInfo),
    );

    return toAuthPayloadOutputDto(user, accessToken, refreshToken);
  }
}
