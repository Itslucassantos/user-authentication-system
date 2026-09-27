export default class PermissionInUseError extends Error {
  constructor(id: string) {
    super(`Permission with id "${id}" is assigned to one or more roles`);
    this.name = 'PermissionInUseError';
  }
}
