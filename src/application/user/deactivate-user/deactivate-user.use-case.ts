import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import type { DeactivateUserInputDto } from './deactivate-user.dto.js';

export default class DeactivateUserUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(input: DeactivateUserInputDto): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new UserNotFoundError(input.userId);

    user.deactivate();
    await this.userRepository.update(user);
  }
}
