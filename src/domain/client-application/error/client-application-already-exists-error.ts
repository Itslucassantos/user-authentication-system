export default class ClientApplicationAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Client Application with name "${name}" already exists`);
    this.name = 'ClientApplicationAlreadyExistsError';
  }
}
