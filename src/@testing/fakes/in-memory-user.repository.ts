import type {
  PaginatedResult,
  PaginationParams,
} from '../../domain/@shared/repository/pagination.js';
import type User from '../../domain/user/entity/user.js';
import UserAlreadyExistsError from '../../domain/user/error/user-already-exists-error.js';
import UserNotFoundError from '../../domain/user/error/user-not-found-error.js';
import UserFactory from '../../domain/user/factory/user.factory.js';
import type UserRepositoryInterface from '../../domain/user/repository/user-repository.interface.js';
import type Email from '../../domain/user/value-object/email.js';
import { paginate } from './paginate.js';

/**
 * Stores snapshots instead of references, like a real database would, so a use case that
 * mutates an entity but forgets to call `update` is caught by the tests.
 */
export default class InMemoryUserRepository implements UserRepositoryInterface {
  private readonly users = new Map<string, User>();

  seed(...users: User[]): this {
    users.forEach((user) => this.users.set(user.id, this.snapshot(user)));
    return this;
  }

  all(): User[] {
    return [...this.users.values()].map((user) => this.snapshot(user));
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? this.snapshot(user) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const target = email.value.toLowerCase();
    const user = this.all().find((candidate) => candidate.email.value.toLowerCase() === target);
    return user ?? null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.all().filter((user) => ids.includes(user.id));
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<User>> {
    return paginate(this.all(), params);
  }

  async findAllByClientApplication(
    clientApplicationId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<User>> {
    const users = this.all().filter((user) => user.rolesFor(clientApplicationId).length > 0);
    return paginate(users, params);
  }

  async save(user: User): Promise<void> {
    if (await this.findByEmail(user.email)) throw new UserAlreadyExistsError(user.email.value);
    this.users.set(user.id, this.snapshot(user));
  }

  async update(user: User): Promise<void> {
    if (!this.users.has(user.id)) throw new UserNotFoundError(user.id);
    this.users.set(user.id, this.snapshot(user));
  }

  async delete(id: string): Promise<void> {
    if (!this.users.delete(id)) throw new UserNotFoundError(id);
  }

  private snapshot(user: User): User {
    return UserFactory.restore({
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      active: user.active,
      roles: user.roles,
    });
  }
}
