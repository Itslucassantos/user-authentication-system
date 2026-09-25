import type RoleRepositoryInterface from '../../../domain/role/repository/role-repository.interface.js';
import { toRoleOutputDto } from '../@shared/role-output.dto.js';
import type { GetRoleInputDto, GetRoleOutputDto } from './get-role.dto.js';

export default class GetRoleUseCase {
  constructor(private readonly roleRepository: RoleRepositoryInterface) {}

  async execute(input: GetRoleInputDto): Promise<GetRoleOutputDto | null> {
    const role = await this.roleRepository.findById(input.roleId);
    if (!role) return null;

    return toRoleOutputDto(role);
  }
}
