import RoleNotFoundError from '../../../domain/role/error/role-not-found-error.js';
import type RoleRepositoryInterface from '../../../domain/role/repository/role-repository.interface.js';
import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import type { AssignRolesToUserInputDto } from './assign-roles-to-user.dto.js';

export default class AssignRolesToUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly roleRepository: RoleRepositoryInterface,
  ) {}

  async execute(input: AssignRolesToUserInputDto): Promise<void> {
    const { userId, roleIds, clientApplicationId } = input;

    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const roles = await this.roleRepository.findByIds(roleIds);

    const foundRoleIds = new Set(roles.map((role) => role.id));
    const missingRoleId = roleIds.find((id) => !foundRoleIds.has(id));
    if (missingRoleId) throw new RoleNotFoundError(missingRoleId);

    const outOfScopeRole = roles.find((role) => role.clientApplicationId !== clientApplicationId);
    if (outOfScopeRole) throw new RoleNotFoundError(outOfScopeRole.id);

    const alreadyAssignedRoleIds = new Set(user.roles.map((role) => role.id));
    const newRoles = roles.filter((role) => !alreadyAssignedRoleIds.has(role.id));

    user.setRoles([...user.roles, ...newRoles]);
    await this.userRepository.update(user);
  }
}
