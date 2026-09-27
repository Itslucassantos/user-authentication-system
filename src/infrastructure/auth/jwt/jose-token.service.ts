import { SignJWT } from 'jose';
import type TokenServiceInterface from '../../../application/@shared/token-service.interface.js';
import type { AccessTokenPayload } from '../../../application/@shared/token-service.interface.js';

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
}
