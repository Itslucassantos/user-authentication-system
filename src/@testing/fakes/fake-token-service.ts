import type TokenServiceInterface from '../../application/@shared/token-service.interface.js';
import type { AccessTokenPayload } from '../../application/@shared/token-service.interface.js';
import InvalidAccessTokenError from '../../domain/auth/error/invalid-access-token-error.js';

export default class FakeTokenService implements TokenServiceInterface {
  readonly signedPayloads: AccessTokenPayload[] = [];

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    this.signedPayloads.push(payload);
    return `access-token-${this.signedPayloads.length}`;
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const match = /^access-token-(\d+)$/.exec(token);
    const payload = match ? this.signedPayloads[Number(match[1]) - 1] : undefined;
    if (!payload) throw new InvalidAccessTokenError();
    return payload;
  }
}
