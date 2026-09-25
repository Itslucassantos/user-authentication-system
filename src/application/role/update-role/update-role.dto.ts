import type { RoleOutputDto } from '../@shared/role-output.dto.js';

export interface UpdateRoleInputDto {
  roleId: string;
  name: string;
  description: string;
}

export type UpdateRoleOutputDto = RoleOutputDto;
