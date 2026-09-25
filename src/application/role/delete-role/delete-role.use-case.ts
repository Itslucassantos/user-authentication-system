import RoleNotFoundError from "../../../domain/role/error/role-not-found-error.js";
import type RoleRepositoryInterface from "../../../domain/role/repository/role-repository.interface.js";
import type { DeleteRoleInputDto } from "./delete-role.dto.js";

export default class DeleteRoleUseCase {
  constructor(
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}

  async execute(input: DeleteRoleInputDto): Promise<void> {
    const { roleId } = input;

    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new RoleNotFoundError(roleId);

    await this.roleRepository.delete(roleId);
  }
}
