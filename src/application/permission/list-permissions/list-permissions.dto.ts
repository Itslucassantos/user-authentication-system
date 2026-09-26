import type { PermissionOutputDto } from '../@shared/permission-output.dto.js';

export interface ListPermissionsInputDto {
  page: number;
  limit: number;
}

export interface ListPermissionsOutputDto {
  items: PermissionOutputDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
