import type RepositoryInterface from '../../@shared/repository/repository-interface.js';
import type Permission from '../entity/permission.js';

export default interface PermissionRepositoryInterface extends RepositoryInterface<Permission> {
  findByIds(ids: string[]): Promise<Permission[]>;
  isInUse(id: string): Promise<boolean>;
}
