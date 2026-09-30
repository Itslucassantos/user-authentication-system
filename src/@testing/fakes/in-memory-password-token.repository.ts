import type {
  PaginatedResult,
  PaginationParams,
} from '../../domain/@shared/repository/pagination.js';
import type PasswordToken from '../../domain/auth/entity/password-token.js';
import PasswordTokenNotFoundError from '../../domain/auth/error/password-token-not-found-error.js';
import PasswordTokenFactory from '../../domain/auth/factory/password-token.factory.js';
import type PasswordTokenRepositoryInterface from '../../domain/auth/repository/password-token-repository.interface.js';
import { paginate } from './paginate.js';

export default class InMemoryPasswordTokenRepository implements PasswordTokenRepositoryInterface {
  private readonly tokens = new Map<string, PasswordToken>();

  seed(...tokens: PasswordToken[]): this {
    tokens.forEach((token) => this.tokens.set(token.id, this.snapshot(token)));
    return this;
  }

  all(): PasswordToken[] {
    return [...this.tokens.values()].map((token) => this.snapshot(token));
  }

  async findById(id: string): Promise<PasswordToken | null> {
    const token = this.tokens.get(id);
    return token ? this.snapshot(token) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordToken | null> {
    return this.all().find((token) => token.tokenHash === tokenHash) ?? null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<PasswordToken>> {
    return paginate(this.all(), params);
  }

  async save(token: PasswordToken): Promise<void> {
    this.tokens.set(token.id, this.snapshot(token));
  }

  async update(token: PasswordToken): Promise<void> {
    if (!this.tokens.has(token.id)) throw new PasswordTokenNotFoundError(token.id);
    this.tokens.set(token.id, this.snapshot(token));
  }

  async delete(id: string): Promise<void> {
    if (!this.tokens.delete(id)) throw new PasswordTokenNotFoundError(id);
  }

  private snapshot(token: PasswordToken): PasswordToken {
    return PasswordTokenFactory.restore(
      token.id,
      token.userId,
      token.type,
      token.tokenHash,
      token.expiresAt,
      token.used,
    );
  }
}
