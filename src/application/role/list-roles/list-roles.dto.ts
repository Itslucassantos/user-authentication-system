import type { RoleOutputDto } from '../@shared/role-output.dto.js';

export interface ListRolesInputDto {
  clientApplicationId: string;
  page: number;
  limit: number;
}

export interface ListRolesOutputDto {
  items: RoleOutputDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
