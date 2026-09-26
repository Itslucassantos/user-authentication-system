import PermissionInUseError from '../../../domain/role/error/permission-in-use-error.js';
import type PermissionRepositoryInterface from '../../../domain/role/repository/permission-repository.interface.js';
import type { DeletePermissionInputDto } from './delete-permission.dto.js';

export default class DeletePermissionUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryInterface) {}

  async execute(input: DeletePermissionInputDto): Promise<void> {
    const inUse = await this.permissionRepository.isInUse(input.permissionId);
    if (inUse) throw new PermissionInUseError(input.permissionId);

    await this.permissionRepository.delete(input.permissionId);
  }
}
