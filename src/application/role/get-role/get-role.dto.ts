import type { RoleOutputDto } from '../@shared/role-output.dto.js';

export interface GetRoleInputDto {
  roleId: string;
}

export type GetRoleOutputDto = RoleOutputDto;
