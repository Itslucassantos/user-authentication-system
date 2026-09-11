import type Permission from './permission.js';

export default class Role {
  private _id: string;
  private _clientApplicationId: string;
  private _name: string;
  private _description: string;
  private _permissions: Permission[];

  constructor(
    id: string,
    clientApplicationId: string,
    name: string,
    description: string,
    permissions: Permission[],
  ) {
    this._id = id;
    this._clientApplicationId = clientApplicationId;
    this._name = name;
    this._description = description;
    this._permissions = permissions;
    this.validate();
  }

  get id(): string {
    return this._id;
  }

  get clientApplicationId(): string {
    return this._clientApplicationId;
  }

  validate(): void {
    if (!this._id) {
      throw new Error('Role ID is required');
    }
    if (!this._clientApplicationId) {
      throw new Error('Application ID is required');
    }
    if (!this._name) {
      throw new Error('Role name is required');
    }
    if (!this._description) {
      throw new Error('Role description is required');
    }
    if (!this._permissions || this._permissions.length === 0) {
      throw new Error('Role must have at least one permission');
    }
  }

  changePermissions(permissions: Permission[]): void {
    if (!permissions || permissions.length === 0) {
      throw new Error('Role must have at least one permission');
    }
    this._permissions = permissions;
  }

  hasPermission(resource: string, action: string): boolean {
    return this._permissions.some(permission =>
      permission.resource === resource && permission.action === action
    );
  }
}
