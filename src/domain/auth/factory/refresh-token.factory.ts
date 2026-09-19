import { v4 as uuid } from 'uuid';
import RefreshToken from '../entity/refresh-token.js';

// Deve acompanhar JWT_REFRESH_TTL (.env) — hoje fixo em código, igual ao padrão do PasswordTokenFactory.
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
  ): RefreshToken {
    return new RefreshToken(id, userId, clientApplicationId, tokenHash, deviceInfo, expiresAt);
  }
}
