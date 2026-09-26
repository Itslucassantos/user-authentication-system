import PermissionFactory from '../../../domain/role/factory/permission.factory.js';
import type PermissionRepositoryInterface from '../../../domain/role/repository/permission-repository.interface.js';
import { toPermissionOutputDto } from '../@shared/permission-output.dto.js';
import type {
  CreatePermissionInputDto,
  CreatePermissionOutputDto,
} from './create-permission.dto.js';

export default class CreatePermissionUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryInterface) {}

  async execute(input: CreatePermissionInputDto): Promise<CreatePermissionOutputDto> {
    const permission = PermissionFactory.create(
      input.name,
      input.resource,
      input.action,
      input.description,
    );

    await this.permissionRepository.save(permission);

    return toPermissionOutputDto(permission);
  }
}
