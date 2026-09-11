import type Role from '../../role/entity/role.js';
import type Email from '../value-object/email.js';

export default class User {
  private _id: string;
  private _name: string;
  private _email: Email;
  private _passwordHash: string;
  private _active: boolean = false;
  private _roles: Role[] = [];

  constructor(id: string, name: string, email: Email, passwordHash: string) {
    this._id = id;
    this._name = name;
    this._email = email;
    this._passwordHash = passwordHash;
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

  get passwordHash(): string {
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
    if (!this._passwordHash) {
      throw new Error('Password hash is required');
    }
  }

  changeRoles(roles: Role[]): void {
    this._roles = roles ?? [];
  }

  isActive(): boolean {
    return this._active;
  }

  activate(): void {
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }
}
