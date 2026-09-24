import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import type { ActivateUserInputDto } from './activate-user.dto.js';

export default class ActivateUserUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(input: ActivateUserInputDto): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new UserNotFoundError(input.userId);

    user.activate();
    await this.userRepository.update(user);
  }
}
