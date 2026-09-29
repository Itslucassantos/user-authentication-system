export default class InvalidAccessTokenError extends Error {
  constructor() {
    super('Access token is invalid or expired');
    this.name = 'InvalidAccessTokenError';
  }
}
