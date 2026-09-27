import type RefreshToken from '../entity/refresh-token.js';

export default interface RefreshTokenRepositoryInterface {
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  save(entity: RefreshToken): Promise<void>;
  update(entity: RefreshToken): Promise<void>;
  delete(entity: RefreshToken): Promise<void>;
  deleteAllByUserId(userId: string): Promise<void>;
}
