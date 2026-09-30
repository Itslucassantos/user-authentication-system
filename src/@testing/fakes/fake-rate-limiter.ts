import type RateLimiterInterface from '../../application/@shared/rate-limiter.interface.js';
import TooManyRequestsError from '../../application/@shared/too-many-requests-error.js';

/** A key is blocked once it has accumulated `maxHits` hits, until it is reset. */
export default class FakeRateLimiter implements RateLimiterInterface {
  private readonly hits = new Map<string, number>();

  constructor(private readonly maxHits = Number.POSITIVE_INFINITY) {}

  hitsFor(key: string): number {
    return this.hits.get(key) ?? 0;
  }

  async ensureNotBlocked(key: string): Promise<void> {
    if (this.hitsFor(key) >= this.maxHits) throw new TooManyRequestsError(60);
  }

  async hit(key: string): Promise<void> {
    this.hits.set(key, this.hitsFor(key) + 1);
  }

  async reset(key: string): Promise<void> {
    this.hits.delete(key);
  }
}
