import { useIntegrationInfrastructure } from '../../@testing/integration/lifecycle.js';
import TooManyRequestsError from '../../application/@shared/too-many-requests-error.js';
import { redis } from '../redis/redis-client.js';
import RedisRateLimiter from './redis-rate-limiter.js';

describe('RedisRateLimiter (Redis)', () => {
  useIntegrationInfrastructure();
  const config = { maxAttempts: 3, blockSeconds: 60 };

  it('allows attempts below the limit', async () => {
    const limiter = new RedisRateLimiter(redis, config);
    await limiter.hit('key');
    await limiter.hit('key');

    await expect(limiter.ensureNotBlocked('key')).resolves.toBeUndefined();
  });

  it('blocks once maxAttempts is reached and reports how long to wait', async () => {
    const limiter = new RedisRateLimiter(redis, config);
    for (let i = 0; i < 3; i += 1) await limiter.hit('key');

    const error = await limiter.ensureNotBlocked('key').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TooManyRequestsError);
    expect((error as TooManyRequestsError).retryAfterSeconds).toBeGreaterThan(0);
    expect((error as TooManyRequestsError).retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('keeps the block in place when more hits arrive while blocked', async () => {
    const limiter = new RedisRateLimiter(redis, config);
    for (let i = 0; i < 6; i += 1) await expect(limiter.hit('key')).resolves.toBeUndefined();

    await expect(limiter.ensureNotBlocked('key')).rejects.toBeInstanceOf(TooManyRequestsError);
  });

  it('counts each key separately', async () => {
    const limiter = new RedisRateLimiter(redis, config);
    for (let i = 0; i < 3; i += 1) await limiter.hit('blocked');

    await expect(limiter.ensureNotBlocked('other')).resolves.toBeUndefined();
  });

  it('reset clears the counter and lifts the block', async () => {
    const limiter = new RedisRateLimiter(redis, config);
    for (let i = 0; i < 3; i += 1) await limiter.hit('key');

    await limiter.reset('key');
    await expect(limiter.ensureNotBlocked('key')).resolves.toBeUndefined();
  });

  it('stores counters under the "rl" key prefix with an expiry', async () => {
    const limiter = new RedisRateLimiter(redis, config);
    await limiter.hit('login:someone');

    const keys = await redis.keys('rl:*');
    expect(keys).toHaveLength(1);
    expect(await redis.pttl(keys[0]!)).toBeGreaterThan(0);
  });
});
