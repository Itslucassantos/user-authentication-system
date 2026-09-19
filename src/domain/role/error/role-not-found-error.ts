export default class RoleNotFoundError extends Error {
  constructor(id: string) {
    super(`Role with id "${id}" not found`);
    this.name = 'RoleNotFoundError';
  }
}
