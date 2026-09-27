import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import type { DeleteUserInputDto } from './delete-user.dto.js';

export default class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(input: DeleteUserInputDto): Promise<void> {
    await this.userRepository.delete(input.userId);
  }
}
