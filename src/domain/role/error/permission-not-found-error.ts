export default class PermissionNotFoundError extends Error {
  constructor(id: string) {
    super(`Permission with id "${id}" not found`);
    this.name = 'PermissionNotFoundError';
  }
}
