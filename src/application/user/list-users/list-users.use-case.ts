import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import type { ListUsersInputDto, ListUsersOutputDto } from './list-users.dto.js';

export default class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(input: ListUsersInputDto): Promise<ListUsersOutputDto> {
    const { page, limit, clientApplicationId } = input;

    const result = clientApplicationId
      ? await this.userRepository.findAllByClientApplication(clientApplicationId, { page, limit })
      : await this.userRepository.findAll({ page, limit });

    return {
      items: result.items.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email.value,
        active: user.active,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
