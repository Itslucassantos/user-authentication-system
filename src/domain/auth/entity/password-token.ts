import type { PasswordTokenType } from '../enum/password-token-type.enum.js';

export default class PasswordToken {
  private _id: string;
  private _userId: string;
  private _type: PasswordTokenType;
  private _tokenHash: string;
  private _used: boolean = false;
  private _expiresAt: Date;

  constructor(
    id: string,
    userId: string,
    type: PasswordTokenType,
    tokenHash: string,
    expiresAt: Date,
  ) {
    this._id = id;
    this._userId = userId;
    this._type = type;
    this._tokenHash = tokenHash;
    this._expiresAt = expiresAt;
    this.validate();
  }

  validate(): void {
    if (!this._id) {
      throw new Error('ID is required');
    }
    if (!this._userId) {
      throw new Error('User ID is required');
    }
    if (!this._type) {
      throw new Error('Type is required');
    }
    if (!this._tokenHash) {
      throw new Error('Token hash is required');
    }
    if (!this._expiresAt) {
      throw new Error('Expiration date is required');
    }
  }

  isValid(): boolean {
    return !this._used && this._expiresAt > new Date();
  }

  markUsed(): void {
    this._used = true;
  }
}
