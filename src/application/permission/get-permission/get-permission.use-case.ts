import type PermissionRepositoryInterface from '../../../domain/role/repository/permission-repository.interface.js';
import { toPermissionOutputDto } from '../@shared/permission-output.dto.js';
import type { GetPermissionInputDto, GetPermissionOutputDto } from './get-permission.dto.js';

export default class GetPermissionUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryInterface) {}

  async execute(input: GetPermissionInputDto): Promise<GetPermissionOutputDto | null> {
    const permission = await this.permissionRepository.findById(input.permissionId);
    if (!permission) return null;

    return toPermissionOutputDto(permission);
  }
}
