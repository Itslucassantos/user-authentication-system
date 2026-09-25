import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import PermissionNotFoundError from '../../../domain/role/error/permission-not-found-error.js';
import RoleAlreadyExistsError from '../../../domain/role/error/role-already-exists-error.js';
import RoleFactory from '../../../domain/role/factory/role.factory.js';
import type PermissionRepositoryInterface from '../../../domain/role/repository/permission-repository.interface.js';
import type RoleRepositoryInterface from '../../../domain/role/repository/role-repository.interface.js';
import { toRoleOutputDto } from '../@shared/role-output.dto.js';
import type { CreateRoleInputDto, CreateRoleOutputDto } from './create-role.dto.js';

export default class CreateRoleUseCase {
  constructor(
    private readonly roleRepository: RoleRepositoryInterface,
    private readonly permissionRepository: PermissionRepositoryInterface,
    private readonly clientApplicationRepository: ClientApplicationRepositoryInterface,
  ) {}

  async execute(input: CreateRoleInputDto): Promise<CreateRoleOutputDto> {
    const { clientApplicationId, name, description, permissionIds } = input;

    const clientApplication = await this.clientApplicationRepository.findById(clientApplicationId);
    if (!clientApplication) throw new ClientApplicationNotFoundError(clientApplicationId);

    const existing = await this.roleRepository.findByName(clientApplicationId, name);
    if (existing) throw new RoleAlreadyExistsError(name);

    const permissions = await this.permissionRepository.findByIds(permissionIds);

    const foundPermissionIds = new Set(permissions.map((permission) => permission.id));
    const missingPermissionId = permissionIds.find((id) => !foundPermissionIds.has(id));
    if (missingPermissionId) throw new PermissionNotFoundError(missingPermissionId);

    const role = RoleFactory.create(clientApplicationId, name, description, permissions);
    await this.roleRepository.save(role);

    return toRoleOutputDto(role);
  }
}
