import PermissionNotFoundError from '../../../domain/role/error/permission-not-found-error.js';
import type PermissionRepositoryInterface from '../../../domain/role/repository/permission-repository.interface.js';
import { toPermissionOutputDto } from '../@shared/permission-output.dto.js';
import type {
  UpdatePermissionInputDto,
  UpdatePermissionOutputDto,
} from './update-permission.dto.js';

export default class UpdatePermissionUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryInterface) {}

  async execute(input: UpdatePermissionInputDto): Promise<UpdatePermissionOutputDto> {
    const { permissionId, description } = input;

    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) throw new PermissionNotFoundError(permissionId);

    permission.changeDescription(description);
    await this.permissionRepository.update(permission);

    return toPermissionOutputDto(permission);
  }
}
