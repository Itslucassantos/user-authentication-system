import type { PermissionOutputDto } from '../@shared/permission-output.dto.js';

export interface CreatePermissionInputDto {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export type CreatePermissionOutputDto = PermissionOutputDto;
