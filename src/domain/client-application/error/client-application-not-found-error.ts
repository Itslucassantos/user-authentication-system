export default class ClientApplicationNotFoundError extends Error {
  constructor(id: string) {
    super(`Client application with id "${id}" not found`);
    this.name = 'ClientApplicationNotFoundError';
  }
}