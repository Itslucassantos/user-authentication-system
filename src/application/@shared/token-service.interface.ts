export interface AccessTokenPayload {
  sub: string;
  clientApplicationId: string;
  roles: string[];
  permissions: string[];
}

export default interface TokenServiceInterface {
  signAccessToken(payload: AccessTokenPayload): Promise<string>;
}
