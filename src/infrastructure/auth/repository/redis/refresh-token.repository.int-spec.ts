import { makeRefreshToken } from '../../../../@testing/builders.js';
import { useIntegrationInfrastructure } from '../../../../@testing/integration/lifecycle.js';
import RefreshTokenNotFoundError from '../../../../domain/auth/error/refresh-token-not-found-error.js';
import { redis } from '../../../redis/redis-client.js';
import RefreshTokenRepository from './refresh-token.repository.js';

const MINUTE_MS = 60 * 1000;

describe('RefreshTokenRepository (Redis)', () => {
  useIntegrationInfrastructure();
  const repository = new RefreshTokenRepository(redis);

  it('saves a token and finds it by hash with all its fields', async () => {
    const token = makeRefreshToken({ tokenHash: 'hash-1', deviceInfo: 'Firefox' });
    await repository.save(token);

    const found = await repository.findByTokenHash('hash-1');
    expect(found).toMatchObject({
      id: token.id,
      userId: token.userId,
      clientApplicationId: token.clientApplicationId,
      deviceInfo: 'Firefox',
      revoked: false,
    });
    expect(found?.expiresAt.getTime()).toBe(token.expiresAt.getTime());
    expect(await repository.findByTokenHash('unknown')).toBeNull();
  });

  it('stores the token with a TTL matching its expiry', async () => {
    await repository.save(
      makeRefreshToken({ tokenHash: 'ttl', expiresAt: new Date(Date.now() + 10 * MINUTE_MS) }),
    );

    const ttl = await redis.pttl('refresh_token:ttl');
    expect(ttl).toBeGreaterThan(9 * MINUTE_MS);
    expect(ttl).toBeLessThanOrEqual(10 * MINUTE_MS);
  });

  it('does not store an already-expired token', async () => {
    await repository.save(
      makeRefreshToken({ tokenHash: 'old', expiresAt: new Date(Date.now() - 1) }),
    );
    expect(await repository.findByTokenHash('old')).toBeNull();
  });

  it('revokes an active token while keeping its remaining TTL', async () => {
    const token = makeRefreshToken({
      tokenHash: 'revoke',
      expiresAt: new Date(Date.now() + 10 * MINUTE_MS),
    });
    await repository.save(token);

    token.revoke();
    await repository.update(token);

    expect((await repository.findByTokenHash('revoke'))?.revoked).toBe(true);
    expect(await redis.pttl('refresh_token:revoke')).toBeGreaterThan(0);
  });

  it('refuses to update a token that is missing or already revoked', async () => {
    const missing = makeRefreshToken({ tokenHash: 'missing' });
    await expect(repository.update(missing)).rejects.toBeInstanceOf(RefreshTokenNotFoundError);

    const token = makeRefreshToken({ tokenHash: 'twice' });
    await repository.save(token);
    token.revoke();
    await repository.update(token);
    await expect(repository.update(token)).rejects.toBeInstanceOf(RefreshTokenNotFoundError);
  });

  it('deletes a token and throws when it no longer exists', async () => {
    const token = makeRefreshToken({ tokenHash: 'delete' });
    await repository.save(token);

    await repository.delete(token);
    expect(await repository.findByTokenHash('delete')).toBeNull();
    await expect(repository.delete(token)).rejects.toBeInstanceOf(RefreshTokenNotFoundError);
  });

  it('deleteAllByUserId removes every session of that user only', async () => {
    const mine = ['a', 'b', 'c'].map((hash) =>
      makeRefreshToken({ userId: 'user-1', tokenHash: hash }),
    );
    const other = makeRefreshToken({ userId: 'user-2', tokenHash: 'other' });
    for (const token of [...mine, other]) await repository.save(token);

    await repository.deleteAllByUserId('user-1');

    for (const token of mine) expect(await repository.findByTokenHash(token.tokenHash)).toBeNull();
    expect(await repository.findByTokenHash('other')).not.toBeNull();
    expect(await redis.exists('user_sessions:user-1')).toBe(0);
  });

  it('deleteAllByUserId is a no-op for a user without sessions', async () => {
    await expect(repository.deleteAllByUserId('nobody')).resolves.toBeUndefined();
  });
});
