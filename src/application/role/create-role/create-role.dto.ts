import type { RoleOutputDto } from '../@shared/role-output.dto.js';

export interface CreateRoleInputDto {
  clientApplicationId: string;
  name: string;
  description: string;
  permissionIds: string[];
}

export type CreateRoleOutputDto = RoleOutputDto;
