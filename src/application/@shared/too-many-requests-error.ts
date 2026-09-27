export default class TooManyRequestsError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super(`Too many requests. Try again in ${retryAfterSeconds} seconds`);
    this.name = 'TooManyRequestsError';
  }
}
