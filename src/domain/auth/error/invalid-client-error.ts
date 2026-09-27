export default class InvalidClientError extends Error {
  constructor(clientId: string) {
    super(`Client with clientId "${clientId}" is invalid or inactive`);
    this.name = 'InvalidClientError';
  }
}
