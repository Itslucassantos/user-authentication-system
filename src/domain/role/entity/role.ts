import type Permission from './permission.js';

export default class Role {
  private _id: string;
  private _clientApplicationId: string;
  private _name: string;
  private _description: string;
  private _permissions?: Permission[] = [];

  constructor(
    id: string,
    clientApplicationId: string,
    name: string,
    description: string,
    permissions?: Permission[],
  ) {
    this._id = id;
    this._clientApplicationId = clientApplicationId;
    this._name = name;
    this._description = description;
    this._permissions = permissions ?? [];
    this.validate();
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
  }

  changePermissions(permissions?: Permission[]): void {
    this._permissions = permissions ?? [];
  }
}
