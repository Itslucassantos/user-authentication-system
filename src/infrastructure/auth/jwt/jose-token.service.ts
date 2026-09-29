import { errors, jwtVerify, SignJWT } from 'jose';
import type TokenServiceInterface from '../../../application/@shared/token-service.interface.js';
import type { AccessTokenPayload } from '../../../application/@shared/token-service.interface.js';
import InvalidAccessTokenError from '../../../domain/auth/error/invalid-access-token-error.js';

export interface JwtConfig {
  accessSecret: string;
  accessTtl: string;
}

const ALGORITHM = 'HS256';

export default class JoseTokenService implements TokenServiceInterface {
  private readonly accessSecret: Uint8Array;

  constructor(private readonly config: JwtConfig) {
    this.accessSecret = new TextEncoder().encode(config.accessSecret);
  }

  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    const { sub, ...claims } = payload;
    return new SignJWT(claims)
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(this.config.accessTtl)
      .sign(this.accessSecret);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    let payload;
    try {
      ({ payload } = await jwtVerify(token, this.accessSecret, { algorithms: [ALGORITHM] }));
    } catch (error) {
      if (error instanceof errors.JOSEError) throw new InvalidAccessTokenError();
      throw error;
    }

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.clientApplicationId !== 'string' ||
      !Array.isArray(payload.roles) ||
      !Array.isArray(payload.permissions)
    ) {
      throw new InvalidAccessTokenError();
    }

    return {
      sub: payload.sub,
      clientApplicationId: payload.clientApplicationId,
      roles: payload.roles as string[],
      permissions: payload.permissions as string[],
    };
  }
}
