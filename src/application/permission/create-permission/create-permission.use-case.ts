import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import type ClientApplicationRepositoryInterface from '../../../domain/client-application/repository/client-application-repository.interface.js';
import PermissionFactory from '../../../domain/role/factory/permission.factory.js';
import type PermissionRepositoryInterface from '../../../domain/role/repository/permission-repository.interface.js';
import { toPermissionOutputDto } from '../@shared/permission-output.dto.js';
import type {
  CreatePermissionInputDto,
  CreatePermissionOutputDto,
} from './create-permission.dto.js';

export default class CreatePermissionUseCase {
  constructor(
    private readonly permissionRepository: PermissionRepositoryInterface,
    private readonly clientApplicationRepository: ClientApplicationRepositoryInterface,
  ) {}

  async execute(input: CreatePermissionInputDto): Promise<CreatePermissionOutputDto> {
    const { clientApplicationId, name, resource, action, description } = input;

    const clientApplication = await this.clientApplicationRepository.findById(clientApplicationId);
    if (!clientApplication) throw new ClientApplicationNotFoundError(clientApplicationId);

    const permission = PermissionFactory.create(
      clientApplicationId,
      name,
      resource,
      action,
      description,
    );

    await this.permissionRepository.save(permission);

    return toPermissionOutputDto(permission);
  }
}
