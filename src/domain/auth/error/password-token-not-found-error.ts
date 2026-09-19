export default class PasswordTokenNotFoundError extends Error {
  constructor(id: string) {
    super(`Password token with id "${id}" not found`);
    this.name = 'PasswordTokenNotFoundError';
  }
}
