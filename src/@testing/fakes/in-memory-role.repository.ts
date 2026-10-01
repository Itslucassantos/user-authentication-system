import type {
  PaginatedResult,
  PaginationParams,
} from '../../domain/@shared/repository/pagination.js';
import type Role from '../../domain/role/entity/role.js';
import RoleAlreadyExistsError from '../../domain/role/error/role-already-exists-error.js';
import RoleNotFoundError from '../../domain/role/error/role-not-found-error.js';
import RoleFactory from '../../domain/role/factory/role.factory.js';
import type RoleRepositoryInterface from '../../domain/role/repository/role-repository.interface.js';
import { paginate } from './paginate.js';

export default class InMemoryRoleRepository implements RoleRepositoryInterface {
  private readonly roles = new Map<string, Role>();

  seed(...roles: Role[]): this {
    roles.forEach((role) => this.roles.set(role.id, this.snapshot(role)));
    return this;
  }

  all(): Role[] {
    return [...this.roles.values()].map((role) => this.snapshot(role));
  }

  async findById(id: string): Promise<Role | null> {
    const role = this.roles.get(id);
    return role ? this.snapshot(role) : null;
  }

  async findByIds(ids: string[]): Promise<Role[]> {
    return this.all().filter((role) => ids.includes(role.id));
  }

  async findByName(clientApplicationId: string, name: string): Promise<Role | null> {
    const role = this.all().find(
      (candidate) =>
        candidate.clientApplicationId === clientApplicationId && candidate.name === name,
    );
    return role ?? null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Role>> {
    return paginate(this.all(), params);
  }

  async findAllByClientApplication(
    clientApplicationId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Role>> {
    const roles = this.all().filter((role) => role.clientApplicationId === clientApplicationId);
    return paginate(roles, params);
  }

  async save(role: Role): Promise<void> {
    if (await this.findByName(role.clientApplicationId, role.name)) {
      throw new RoleAlreadyExistsError(role.name);
    }
    this.roles.set(role.id, this.snapshot(role));
  }

  async update(role: Role): Promise<void> {
    if (!this.roles.has(role.id)) throw new RoleNotFoundError(role.id);
    this.roles.set(role.id, this.snapshot(role));
  }

  async delete(id: string): Promise<void> {
    if (!this.roles.delete(id)) throw new RoleNotFoundError(id);
  }

  private snapshot(role: Role): Role {
    return RoleFactory.restore(role.id, role.clientApplicationId, role.name, role.description, [
      ...role.permissions,
    ]);
  }
}
