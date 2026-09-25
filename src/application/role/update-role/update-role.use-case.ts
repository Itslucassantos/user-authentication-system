import RoleAlreadyExistsError from '../../../domain/role/error/role-already-exists-error.js';
import RoleNotFoundError from '../../../domain/role/error/role-not-found-error.js';
import type RoleRepositoryInterface from '../../../domain/role/repository/role-repository.interface.js';
import { toRoleOutputDto } from '../@shared/role-output.dto.js';
import type { UpdateRoleInputDto, UpdateRoleOutputDto } from './update-role.dto.js';

export default class UpdateRoleUseCase {
  constructor(private readonly roleRepository: RoleRepositoryInterface) {}

  async execute(input: UpdateRoleInputDto): Promise<UpdateRoleOutputDto> {
    const { roleId, name, description } = input;

    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new RoleNotFoundError(roleId);

    const existing = await this.roleRepository.findByName(role.clientApplicationId, name);
    if (existing && existing.id !== role.id) throw new RoleAlreadyExistsError(name);

    role.changeName(name);
    role.changeDescription(description);
    await this.roleRepository.update(role);

    return toRoleOutputDto(role);
  }
}
