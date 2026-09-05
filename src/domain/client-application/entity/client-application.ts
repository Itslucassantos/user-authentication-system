import type Role from '../../role/entity/role.js';

export default class ClientApplication {
  private _id: string;
  private _name: string;
  private _clientId: string;
  private _clientSecretHash: string;
  private _redirectUris: string[] = [];
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
    this._redirectUris = redirectUris ?? [];
    this._roles = roles ?? [];
    this.validate();
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
}
