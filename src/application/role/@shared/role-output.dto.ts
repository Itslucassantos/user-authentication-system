import type Role from '../../../domain/role/entity/role.js';

export interface PermissionOutputDto {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

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
    permissions: role.permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    })),
  };
}
