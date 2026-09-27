import type { PaginatedResult, PaginationParams } from '../../@shared/repository/pagination.js';
import type RepositoryInterface from '../../@shared/repository/repository-interface.js';
import type Permission from '../entity/permission.js';

export default interface PermissionRepositoryInterface extends RepositoryInterface<Permission> {
  findByIds(clientApplicationId: string, ids: string[]): Promise<Permission[]>;
  findByResourceAndAction(
    clientApplicationId: string,
    resource: string,
    action: string,
  ): Promise<Permission | null>;
  findAllByClientApplication(
    clientApplicationId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Permission>>;
  isInUse(id: string): Promise<boolean>;
}
