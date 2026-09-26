import type Role from '../../../domain/role/entity/role.js';
import {
  type PermissionOutputDto,
  toPermissionOutputDto,
} from '../../permission/@shared/permission-output.dto.js';

export interface RoleOutputDto {
  id: string;
  clientApplicationId: string;
  name: string;
  description: string;
  permissions: PermissionOutputDto[];
}

export function toRoleOutputDto(role: Role): RoleOutputDto {
  return {
    id: role.id,
    clientApplicationId: role.clientApplicationId,
    name: role.name,
    description: role.description,
    permissions: role.permissions.map(toPermissionOutputDto),
  };
}
