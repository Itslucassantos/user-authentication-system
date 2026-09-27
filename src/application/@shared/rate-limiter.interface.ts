export default interface RateLimiterInterface {
  ensureNotBlocked(key: string): Promise<void>;
  hit(key: string): Promise<void>;
  reset(key: string): Promise<void>;
}
