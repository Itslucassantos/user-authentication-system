import type Role from '../../role/entity/role.js';
import type Email from '../value-object/email.js';

export default class User {
  private _id: string;
  private _name: string;
  private _email: Email;
  private _passwordHash: string | null = null;
  private _active: boolean = false;
  private _roles: Role[] = [];

  constructor(id: string, name: string, email: Email) {
    this._id = id;
    this._name = name;
    this._email = email;
    this.validate();
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): Email {
    return this._email;
  }

  get passwordHash(): string | null {
    return this._passwordHash;
  }

  get active(): boolean {
    return this._active;
  }

  get roles(): Role[] {
    return [...this._roles];
  }

  validate(): void {
    if (!this._id) {
      throw new Error('ID is required');
    }
    if (!this._name) {
      throw new Error('Name is required');
    }
    if (!this._email) {
      throw new Error('Email is required');
    }
  }

  activate(): void {
    if (!this._passwordHash) {
      throw new Error('Password must be set before activating the user');
    }
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }

  setPasswordHash(passwordHash: string): void {
    this._passwordHash = passwordHash;
  }

  changeName(name: string): void {
    this._name = name;
    this.validate();
  }

  setRoles(roles: Role[]): void {
    this._roles = roles ?? [];
  }

  hasPermission(resource: string, action: string, clientApplicationId: string): boolean {
    return this.rolesFor(clientApplicationId).some((role) => role.hasPermission(resource, action));
  }

  rolesFor(clientApplicationId: string): Role[] {
    return this._roles.filter((role) => role.clientApplicationId === clientApplicationId);
  }
}
