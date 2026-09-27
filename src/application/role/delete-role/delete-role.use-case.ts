import type RoleRepositoryInterface from '../../../domain/role/repository/role-repository.interface.js';
import type { DeleteRoleInputDto } from './delete-role.dto.js';

export default class DeleteRoleUseCase {
  constructor(private readonly roleRepository: RoleRepositoryInterface) {}

  async execute(input: DeleteRoleInputDto): Promise<void> {
    await this.roleRepository.delete(input.roleId);
  }
}
