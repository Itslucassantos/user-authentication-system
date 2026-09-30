import type RefreshToken from '../../domain/auth/entity/refresh-token.js';
import RefreshTokenNotFoundError from '../../domain/auth/error/refresh-token-not-found-error.js';
import RefreshTokenFactory from '../../domain/auth/factory/refresh-token.factory.js';
import type RefreshTokenRepositoryInterface from '../../domain/auth/repository/refresh-token-repository.interface.js';

export default class InMemoryRefreshTokenRepository implements RefreshTokenRepositoryInterface {
  private readonly tokens = new Map<string, RefreshToken>();

  seed(...tokens: RefreshToken[]): this {
    tokens.forEach((token) => this.tokens.set(token.tokenHash, this.snapshot(token)));
    return this;
  }

  all(): RefreshToken[] {
    return [...this.tokens.values()].map((token) => this.snapshot(token));
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const token = this.tokens.get(tokenHash);
    return token ? this.snapshot(token) : null;
  }

  async save(token: RefreshToken): Promise<void> {
    this.tokens.set(token.tokenHash, this.snapshot(token));
  }

  /** Mirrors the Redis implementation: only an active (non-revoked) token can be updated. */
  async update(token: RefreshToken): Promise<void> {
    const stored = this.tokens.get(token.tokenHash);
    if (!stored || stored.revoked) throw new RefreshTokenNotFoundError();
    this.tokens.set(token.tokenHash, this.snapshot(token));
  }

  async delete(token: RefreshToken): Promise<void> {
    if (!this.tokens.delete(token.tokenHash)) throw new RefreshTokenNotFoundError();
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    for (const [hash, token] of this.tokens) {
      if (token.userId === userId) this.tokens.delete(hash);
    }
  }

  private snapshot(token: RefreshToken): RefreshToken {
    return RefreshTokenFactory.restore(
      token.id,
      token.userId,
      token.clientApplicationId,
      token.tokenHash,
      token.deviceInfo,
      token.expiresAt,
      token.revoked,
    );
  }
}
