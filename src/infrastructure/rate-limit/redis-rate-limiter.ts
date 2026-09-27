import type { Redis } from 'ioredis';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import type RateLimiterInterface from '../../application/@shared/rate-limiter.interface.js';
import TooManyRequestsError from '../../application/@shared/too-many-requests-error.js';

export interface RateLimiterConfig {
  maxAttempts: number;
  blockSeconds: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxAttempts: 5,
  blockSeconds: 2 * 60 * 60,
};

export default class RedisRateLimiter implements RateLimiterInterface {
  private readonly limiter: RateLimiterRedis;

  constructor(
    redis: Redis,
    private readonly config: RateLimiterConfig = DEFAULT_CONFIG,
  ) {
    this.limiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'rl',
      points: config.maxAttempts,
      duration: config.blockSeconds,
    });
  }

  async ensureNotBlocked(key: string): Promise<void> {
    const res = await this.limiter.get(key);
    if (res && res.consumedPoints >= this.config.maxAttempts) {
      throw new TooManyRequestsError(Math.ceil(res.msBeforeNext / 1000));
    }
  }

  async hit(key: string): Promise<void> {
    try {
      const res = await this.limiter.consume(key);
      if (res.remainingPoints === 0) {
        await this.limiter.block(key, this.config.blockSeconds);
      }
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        return;
      }
      throw error;
    }
  }

  async reset(key: string): Promise<void> {
    await this.limiter.delete(key);
  }
}
