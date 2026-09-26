import type { PermissionOutputDto } from '../@shared/permission-output.dto.js';

export interface UpdatePermissionInputDto {
  permissionId: string;
  description?: string;
}

export type UpdatePermissionOutputDto = PermissionOutputDto;
