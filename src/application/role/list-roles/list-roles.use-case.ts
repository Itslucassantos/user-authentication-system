import type RoleRepositoryInterface from '../../../domain/role/repository/role-repository.interface.js';
import { toRoleOutputDto } from '../@shared/role-output.dto.js';
import type { ListRolesInputDto, ListRolesOutputDto } from './list-roles.dto.js';

export default class ListRolesUseCase {
  constructor(private readonly roleRepository: RoleRepositoryInterface) {}

  async execute(input: ListRolesInputDto): Promise<ListRolesOutputDto> {
    const { clientApplicationId, page, limit } = input;

    const result = await this.roleRepository.findAllByClientApplication(clientApplicationId, {
      page,
      limit,
    });

    return {
      items: result.items.map((role) => toRoleOutputDto(role)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
