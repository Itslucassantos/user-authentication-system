import type { PermissionOutputDto } from '../@shared/permission-output.dto.js';

export interface GetPermissionInputDto {
  permissionId: string;
}

export type GetPermissionOutputDto = PermissionOutputDto;
