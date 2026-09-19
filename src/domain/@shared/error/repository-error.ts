export default class RepositoryError extends Error {
  constructor(message: string, cause: unknown) {
    super(message, { cause });
    this.name = 'RepositoryError';
  }
}
