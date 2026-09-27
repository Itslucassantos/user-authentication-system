export default class PermissionAlreadyExistsError extends Error {
  constructor(resource: string, action: string) {
    super(`Permission with resource "${resource}" and action "${action}" already exists`);
    this.name = 'PermissionAlreadyExistsError';
  }
}
