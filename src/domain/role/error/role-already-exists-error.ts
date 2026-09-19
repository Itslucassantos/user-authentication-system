export default class RoleAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Role with name "${name}" already exists`);
    this.name = 'RoleAlreadyExistsError';
  }
}
