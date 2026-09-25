import type { RoleOutputDto } from '../@shared/role-output.dto.js';

export interface AssignPermissionsToRoleInputDto {
  roleId: string;
  permissionIds: string[];
}

export type AssignPermissionsToRoleOutputDto = RoleOutputDto;
