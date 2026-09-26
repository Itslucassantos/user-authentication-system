import type Permission from '../../../domain/role/entity/permission.js';

export interface PermissionOutputDto {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export function toPermissionOutputDto(permission: Permission): PermissionOutputDto {
  return {
    id: permission.id,
    name: permission.name,
    resource: permission.resource,
    action: permission.action,
    description: permission.description,
  };
}
