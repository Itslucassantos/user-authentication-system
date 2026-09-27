export default class RefreshTokenNotFoundError extends Error {
  constructor() {
    super('Active refresh token not found');
    this.name = 'RefreshTokenNotFoundError';
  }
}
