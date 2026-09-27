import type EventDispatcherInterface from '../../../domain/@shared/event/event-dispatcher.interface.js';
import PasswordTokenFactory from '../../../domain/auth/factory/password-token.factory.js';
import type PasswordTokenRepositoryInterface from '../../../domain/auth/repository/password-token-repository.interface.js';
import UserCreatedEvent from '../../../domain/user/event/user-created.event.js';
import UserAlreadyExistsError from '../../../domain/user/error/user-already-exists-error.js';
import UserFactory from '../../../domain/user/factory/user.factory.js';
import type UserRepositoryInterface from '../../../domain/user/repository/user-repository.interface.js';
import Email from '../../../domain/user/value-object/email.js';
import type { CreateUserInputDto, CreateUserOutputDto } from './create-user.dto.js';
import { generateOpaqueToken, sha256 } from '../../@shared/opaque-token.js';

export default class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly passwordTokenRepository: PasswordTokenRepositoryInterface,
    private readonly eventDispatcher: EventDispatcherInterface,
  ) {}

  async execute(input: CreateUserInputDto): Promise<CreateUserOutputDto> {
    const email = new Email(input.email);

    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new UserAlreadyExistsError(email.value);

    const user = UserFactory.create(input.name, email);
    await this.userRepository.save(user);

    const invitationToken = generateOpaqueToken();
    const token = PasswordTokenFactory.createInvitation(user.id, sha256(invitationToken));
    await this.passwordTokenRepository.save(token);

    await this.eventDispatcher.notify(
      new UserCreatedEvent({
        userId: user.id,
        name: user.name,
        email: email.value,
        invitationToken,
      }),
    );

    return {
      id: user.id,
      name: user.name,
      email: email.value,
      active: user.active,
    };
  }
}
