import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import type { UpdateUserInputDto, UpdateUserOutputDto } from './update-user.dto.js';

export default class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepositoryInterface) {}

  async execute(input: UpdateUserInputDto): Promise<UpdateUserOutputDto> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new UserNotFoundError(input.userId);

    user.changeName(input.name);
    await this.userRepository.update(user);

    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      active: user.active,
    };
  }
}
