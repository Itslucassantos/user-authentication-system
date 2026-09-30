import type {
  PaginatedResult,
  PaginationParams,
} from '../../domain/@shared/repository/pagination.js';
import type Permission from '../../domain/role/entity/permission.js';
import PermissionAlreadyExistsError from '../../domain/role/error/permission-already-exists-error.js';
import PermissionNotFoundError from '../../domain/role/error/permission-not-found-error.js';
import PermissionFactory from '../../domain/role/factory/permission.factory.js';
import type PermissionRepositoryInterface from '../../domain/role/repository/permission-repository.interface.js';
import { paginate } from './paginate.js';

export default class InMemoryPermissionRepository implements PermissionRepositoryInterface {
  private readonly permissions = new Map<string, Permission>();
  private readonly inUse = new Set<string>();

  seed(...permissions: Permission[]): this {
    permissions.forEach((permission) =>
      this.permissions.set(permission.id, this.snapshot(permission)),
    );
    return this;
  }

  /** Simulates a role referencing the permission (the real repository checks the join table). */
  markAsInUse(id: string): this {
    this.inUse.add(id);
    return this;
  }

  all(): Permission[] {
    return [...this.permissions.values()].map((permission) => this.snapshot(permission));
  }

  async findById(id: string): Promise<Permission | null> {
    const permission = this.permissions.get(id);
    return permission ? this.snapshot(permission) : null;
  }

  async findByIds(clientApplicationId: string, ids: string[]): Promise<Permission[]> {
    return this.all().filter(
      (permission) =>
        permission.clientApplicationId === clientApplicationId && ids.includes(permission.id),
    );
  }

  async findByResourceAndAction(
    clientApplicationId: string,
    resource: string,
    action: string,
  ): Promise<Permission | null> {
    const permission = this.all().find(
      (candidate) =>
        candidate.clientApplicationId === clientApplicationId &&
        candidate.matches(resource, action),
    );
    return permission ?? null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Permission>> {
    return paginate(this.all(), params);
  }

  async findAllByClientApplication(
    clientApplicationId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Permission>> {
    const permissions = this.all().filter(
      (permission) => permission.clientApplicationId === clientApplicationId,
    );
    return paginate(permissions, params);
  }

  async isInUse(id: string): Promise<boolean> {
    return this.inUse.has(id);
  }

  async save(permission: Permission): Promise<void> {
    if (
      await this.findByResourceAndAction(
        permission.clientApplicationId,
        permission.resource,
        permission.action,
      )
    ) {
      throw new PermissionAlreadyExistsError(permission.resource, permission.action);
    }
    this.permissions.set(permission.id, this.snapshot(permission));
  }

  async update(permission: Permission): Promise<void> {
    if (!this.permissions.has(permission.id)) throw new PermissionNotFoundError(permission.id);
    this.permissions.set(permission.id, this.snapshot(permission));
  }

  async delete(id: string): Promise<void> {
    if (!this.permissions.delete(id)) throw new PermissionNotFoundError(id);
  }

  private snapshot(permission: Permission): Permission {
    return PermissionFactory.restore(
      permission.id,
      permission.clientApplicationId,
      permission.name,
      permission.resource,
      permission.action,
      permission.description,
    );
  }
}
