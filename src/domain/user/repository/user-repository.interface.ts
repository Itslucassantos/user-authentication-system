import type RepositoryInterface from '../../@shared/repository/repository-interface.js';
import type { PaginatedResult, PaginationParams } from '../../@shared/repository/pagination.js';
import type User from '../entity/user.js';
import type Email from '../value-object/email.js';

export default interface UserRepositoryInterface extends RepositoryInterface<User> {
  findByEmail(email: Email): Promise<User | null>;
  findAllByClientApplication(
    clientApplicationId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<User>>;
}
