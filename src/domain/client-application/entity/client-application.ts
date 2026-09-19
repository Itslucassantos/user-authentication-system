import type Role from '../../role/entity/role.js';

export default class ClientApplication {
  private _id: string;
  private _name: string;
  private _clientId: string;
  private _clientSecretHash: string;
  private _redirectUris: string[];
  private _active: boolean = true;
  private _roles: Role[] = [];

  constructor(
    id: string,
    name: string,
    clientId: string,
    clientSecretHash: string,
    redirectUris: string[],
    roles?: Role[],
  ) {
    this._id = id;
    this._name = name;
    this._clientId = clientId;
    this._clientSecretHash = clientSecretHash;
    this._redirectUris = redirectUris;
    this._roles = roles ?? [];
    this.validate();
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get clientId(): string {
    return this._clientId;
  }

  get clientSecretHash(): string {
    return this._clientSecretHash;
  }

  get redirectUris(): string[] {
    return this._redirectUris;
  }

  get active(): boolean {
    return this._active;
  }

  get roles(): Role[] {
    return this._roles;
  }

  validate(): void {
    if (!this._id) {
      throw new Error('Client Application ID is required');
    }
    if (!this._name) {
      throw new Error('Client Application name is required');
    }
    if (!this._clientId) {
      throw new Error('Client ID is required');
    }
    if (!this._clientSecretHash) {
      throw new Error('Client Secret Hash is required');
    }
    if (!this._redirectUris || this._redirectUris.length === 0) {
      throw new Error('At least one redirect URI is required');
    }
  }

  activate(): void {
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }

  rotateClientSecret(newClientSecretHash: string): void {
    this._clientSecretHash = newClientSecretHash;
  }

  addRedirectUri(redirectUri: string): void {
    if (!this._redirectUris.includes(redirectUri)) {
      this._redirectUris.push(redirectUri);
    }
  }

  removeRedirectUri(redirectUri: string): void {
    const remaining = this._redirectUris.filter((uri) => uri !== redirectUri);
    if (remaining.length === 0) {
      throw new Error('At least one redirect URI is required');
    }
    this._redirectUris = remaining;
  }

  hasRedirectUri(redirectUri: string): boolean {
    return this._redirectUris.includes(redirectUri);
  }
}
