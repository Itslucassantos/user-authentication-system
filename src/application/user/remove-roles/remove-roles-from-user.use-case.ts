import RoleNotFoundError from '../../../domain/role/error/role-not-found-error.js';
import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import type { RemoveRolesFromUserInputDto } from './remove-roles-from-user.dto.js';

export default class RemoveRolesFromUserUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(input: RemoveRolesFromUserInputDto): Promise<void> {
    const { userId, roleIds, clientApplicationId } = input;

    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const missingRoleId = roleIds.find((roleId) => !user.roles.some((role) => role.id === roleId));
    if (missingRoleId) throw new RoleNotFoundError(missingRoleId);

    const rolesToRemove = new Set(roleIds);
    const remainingRoles = user.roles.filter(
      (role) => !(rolesToRemove.has(role.id) && role.clientApplicationId === clientApplicationId),
    );

    user.setRoles(remainingRoles);
    await this.userRepository.update(user);
  }
}
