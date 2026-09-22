import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import type { GetUserInputDto, GetUserOutputDto } from './get-user.dto.js';

export default class GetUserUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(input: GetUserInputDto): Promise<GetUserOutputDto | null> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      active: user.active,
    };
  }
}
