import type { PaginatedResult, PaginationParams } from '../../@shared/repository/pagination.js';
import type RepositoryInterface from '../../@shared/repository/repository-interface.js';
import type Role from '../entity/role.js';

export default interface RoleRepositoryInterface extends RepositoryInterface<Role> {
  findByIds(ids: string[]): Promise<Role[]>;
  findByName(clientApplicationId: string, name: string): Promise<Role | null>;
  findAllByClientApplication(
    clientApplicationId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Role>>;
}
