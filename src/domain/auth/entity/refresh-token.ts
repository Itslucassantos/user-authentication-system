export default class RefreshToken {
  private _id: string;
  private _userId: string;
  private _clientApplicationId: string;
  private _tokenHash: string;
  private _deviceInfo: string;
  private _revoked: boolean = false;
  private _expiresAt: Date;

  constructor(
    id: string,
    userId: string,
    clientApplicationId: string,
    tokenHash: string,
    deviceInfo: string,
    expiresAt: Date,
  ) {
    this._id = id;
    this._userId = userId;
    this._clientApplicationId = clientApplicationId;
    this._tokenHash = tokenHash;
    this._deviceInfo = deviceInfo;
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
    if (!this._clientApplicationId) {
      throw new Error('Client Application ID is required');
    }
    if (!this._tokenHash) {
      throw new Error('Token hash is required');
    }
    if (!this._deviceInfo) {
      throw new Error('Device info is required');
    }
    if (!this._expiresAt) {
      throw new Error('Expiration date is required');
    }
  }

  revoke(): void {
    this._revoked = true;
  }
}
