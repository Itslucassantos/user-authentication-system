import PermissionNotFoundError from '../../../domain/role/error/permission-not-found-error.js';
import RoleNotFoundError from '../../../domain/role/error/role-not-found-error.js';
import type PermissionRepositoryInterface from '../../../domain/role/repository/permission-repository.interface.js';
import type RoleRepositoryInterface from '../../../domain/role/repository/role-repository.interface.js';
import { toRoleOutputDto } from '../@shared/role-output.dto.js';
import type {
  AssignPermissionsToRoleInputDto,
  AssignPermissionsToRoleOutputDto,
} from './assign-permissions-to-role.dto.js';

export default class AssignPermissionsToRoleUseCase {
  constructor(
    private readonly roleRepository: RoleRepositoryInterface,
    private readonly permissionRepository: PermissionRepositoryInterface,
  ) {}

  async execute(input: AssignPermissionsToRoleInputDto): Promise<AssignPermissionsToRoleOutputDto> {
    const { roleId, permissionIds } = input;

    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new RoleNotFoundError(roleId);

    const permissions = await this.permissionRepository.findByIds(permissionIds);

    const foundPermissionIds = new Set(permissions.map((permission) => permission.id));
    const missingPermissionId = permissionIds.find((id) => !foundPermissionIds.has(id));
    if (missingPermissionId) throw new PermissionNotFoundError(missingPermissionId);

    role.changePermissions(permissions);
    await this.roleRepository.update(role);

    return toRoleOutputDto(role);
  }
}
