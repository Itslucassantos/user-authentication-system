import type { Redis } from 'ioredis';
import RepositoryError from '../../../../domain/@shared/error/repository-error.js';
import type RefreshToken from '../../../../domain/auth/entity/refresh-token.js';
import RefreshTokenNotFoundError from '../../../../domain/auth/error/refresh-token-not-found-error.js';
import RefreshTokenFactory from '../../../../domain/auth/factory/refresh-token.factory.js';
import type RefreshTokenRepositoryInterface from '../../../../domain/auth/repository/refresh-token-repository.interface.js';

const TOKEN_KEY_PREFIX = 'refresh_token:';
const SESSIONS_KEY_PREFIX = 'user_sessions:';

const UPDATE_ACTIVE_TOKEN_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
if cjson.decode(raw).revoked then return 0 end
redis.call('SET', KEYS[1], ARGV[1], 'KEEPTTL')
if ARGV[2] == '1' then redis.call('SREM', KEYS[2], ARGV[3]) end
return 1
`;

const DELETE_ALL_SESSIONS_SCRIPT = `
local hashes = redis.call('SMEMBERS', KEYS[1])
for _, hash in ipairs(hashes) do redis.call('DEL', ARGV[1] .. hash) end
redis.call('DEL', KEYS[1])
return #hashes
`;

interface StoredRefreshToken {
  id: string;
  userId: string;
  clientApplicationId: string;
  deviceInfo: string;
  expiresAt: string;
  revoked: boolean;
}

const tokenKey = (tokenHash: string): string => `${TOKEN_KEY_PREFIX}${tokenHash}`;
const sessionsKey = (userId: string): string => `${SESSIONS_KEY_PREFIX}${userId}`;

export default class RefreshTokenRepository implements RefreshTokenRepositoryInterface {
  constructor(private readonly redis: Redis) {}

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const raw = await this.redis.get(tokenKey(tokenHash));
    if (!raw) {
      return null;
    }

    const stored = JSON.parse(raw) as StoredRefreshToken;
    return RefreshTokenFactory.restore(
      stored.id,
      stored.userId,
      stored.clientApplicationId,
      tokenHash,
      stored.deviceInfo,
      new Date(stored.expiresAt),
      stored.revoked,
    );
  }

  async save(entity: RefreshToken): Promise<void> {
    const ttlMs = entity.expiresAt.getTime() - Date.now();
    if (ttlMs <= 0) {
      return;
    }

    try {
      await this.redis
        .multi()
        .set(tokenKey(entity.tokenHash), this.serialize(entity), 'PX', ttlMs)
        .sadd(sessionsKey(entity.userId), entity.tokenHash)
        .pexpire(sessionsKey(entity.userId), ttlMs)
        .exec();
    } catch (error) {
      throw new RepositoryError('Failed to save refresh token', error);
    }
  }

  async update(entity: RefreshToken): Promise<void> {
    try {
      const updated = await this.redis.eval(
        UPDATE_ACTIVE_TOKEN_SCRIPT,
        2,
        tokenKey(entity.tokenHash),
        sessionsKey(entity.userId),
        this.serialize(entity),
        entity.revoked ? '1' : '0',
        entity.tokenHash,
      );
      if (updated === 0) {
        throw new RefreshTokenNotFoundError();
      }
    } catch (error) {
      if (error instanceof RefreshTokenNotFoundError) {
        throw error;
      }
      throw new RepositoryError('Failed to update refresh token', error);
    }
  }

  async delete(entity: RefreshToken): Promise<void> {
    try {
      const results = await this.redis
        .multi()
        .del(tokenKey(entity.tokenHash))
        .srem(sessionsKey(entity.userId), entity.tokenHash)
        .exec();
      const deletedCount = results?.[0]?.[1];
      if (deletedCount === 0) {
        throw new RefreshTokenNotFoundError();
      }
    } catch (error) {
      if (error instanceof RefreshTokenNotFoundError) {
        throw error;
      }
      throw new RepositoryError('Failed to delete refresh token', error);
    }
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    try {
      await this.redis.eval(DELETE_ALL_SESSIONS_SCRIPT, 1, sessionsKey(userId), TOKEN_KEY_PREFIX);
    } catch (error) {
      throw new RepositoryError('Failed to delete user refresh tokens', error);
    }
  }

  private serialize(entity: RefreshToken): string {
    const stored: StoredRefreshToken = {
      id: entity.id,
      userId: entity.userId,
      clientApplicationId: entity.clientApplicationId,
      deviceInfo: entity.deviceInfo,
      expiresAt: entity.expiresAt.toISOString(),
      revoked: entity.revoked,
    };
    return JSON.stringify(stored);
  }
}
