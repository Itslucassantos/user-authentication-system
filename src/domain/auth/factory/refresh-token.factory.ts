import { v4 as uuid } from 'uuid';
import RefreshToken from '../entity/refresh-token.js';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export default class RefreshTokenFactory {
  static create(
    userId: string,
    clientApplicationId: string,
    tokenHash: string,
    deviceInfo: string,
  ): RefreshToken {
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    return new RefreshToken(uuid(), userId, clientApplicationId, tokenHash, deviceInfo, expiresAt);
  }

  static restore(
    id: string,
    userId: string,
    clientApplicationId: string,
    tokenHash: string,
    deviceInfo: string,
    expiresAt: Date,
    revoked: boolean,
  ): RefreshToken {
    const token = new RefreshToken(
      id,
      userId,
      clientApplicationId,
      tokenHash,
      deviceInfo,
      expiresAt,
    );
    if (revoked) token.revoke();
    return token;
  }
}
