export default class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Refresh token is invalid, expired or revoked');
    this.name = 'InvalidRefreshTokenError';
  }
}
