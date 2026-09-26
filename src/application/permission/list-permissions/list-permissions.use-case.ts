import type PermissionRepositoryInterface from '../../../domain/role/repository/permission-repository.interface.js';
import { toPermissionOutputDto } from '../@shared/permission-output.dto.js';
import type { ListPermissionsInputDto, ListPermissionsOutputDto } from './list-permissions.dto.js';

export default class ListPermissionsUseCase {
  constructor(private readonly permissionRepository: PermissionRepositoryInterface) {}

  async execute(input: ListPermissionsInputDto): Promise<ListPermissionsOutputDto> {
    const { page, limit } = input;

    const result = await this.permissionRepository.findAll({ page, limit });

    return {
      items: result.items.map((permission) => toPermissionOutputDto(permission)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
