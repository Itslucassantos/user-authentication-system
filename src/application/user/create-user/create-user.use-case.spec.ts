import { makeUser } from '../../../@testing/builders.js';
import FakeEventDispatcher from '../../../@testing/fakes/fake-event-dispatcher.js';
import InMemoryPasswordTokenRepository from '../../../@testing/fakes/in-memory-password-token.repository.js';
import InMemoryUserRepository from '../../../@testing/fakes/in-memory-user.repository.js';
import { PasswordTokenType } from '../../../domain/auth/enum/password-token-type.enum.js';
import UserAlreadyExistsError from '../../../domain/user/error/user-already-exists-error.js';
import UserCreatedEvent from '../../../domain/user/event/user-created.event.js';
import { sha256 } from '../../@shared/opaque-token.js';
import CreateUserUseCase from './create-user.use-case.js';

const makeSut = () => {
  const userRepository = new InMemoryUserRepository();
  const passwordTokenRepository = new InMemoryPasswordTokenRepository();
  const eventDispatcher = new FakeEventDispatcher();
  const useCase = new CreateUserUseCase(userRepository, passwordTokenRepository, eventDispatcher);
  return { useCase, userRepository, passwordTokenRepository, eventDispatcher };
};

describe('CreateUserUseCase', () => {
  it('creates an inactive user without a password and returns its public data', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ name: 'John Doe', email: 'john.doe@example.com' });

    expect(output).toEqual({
      id: expect.any(String),
      name: 'John Doe',
      email: 'john.doe@example.com',
      active: false,
    });
    const [stored] = sut.userRepository.all();
    expect(sut.userRepository.all()).toHaveLength(1);
    expect(stored).toMatchObject({ id: output.id, active: false, passwordHash: null });
  });

  it('stores an invitation token hash that expires in the future', async () => {
    const sut = makeSut();

    const { id } = await sut.useCase.execute({ name: 'John Doe', email: 'john.doe@example.com' });

    const [token] = sut.passwordTokenRepository.all();
    expect(sut.passwordTokenRepository.all()).toHaveLength(1);
    expect(token).toMatchObject({ userId: id, type: PasswordTokenType.INVITATION, used: false });
    expect(token?.isValid()).toBe(true);
  });

  it('announces the raw invitation token through UserCreatedEvent, never persisting it', async () => {
    const sut = makeSut();

    const { id } = await sut.useCase.execute({ name: 'John Doe', email: 'john.doe@example.com' });

    const [event] = sut.eventDispatcher.events as UserCreatedEvent[];
    expect(sut.eventDispatcher.events).toHaveLength(1);
    expect(event).toBeInstanceOf(UserCreatedEvent);
    expect(event?.eventData).toEqual({
      userId: id,
      name: 'John Doe',
      email: 'john.doe@example.com',
      invitationToken: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    const [token] = sut.passwordTokenRepository.all();
    expect(token?.tokenHash).toBe(sha256(event!.eventData.invitationToken));
    expect(token?.tokenHash).not.toBe(event?.eventData.invitationToken);
  });

  it('refuses a duplicated e-mail without creating a token or sending an invitation', async () => {
    const sut = makeSut();
    sut.userRepository.seed(makeUser({ email: 'john.doe@example.com' }));

    await expect(
      sut.useCase.execute({ name: 'Another John', email: 'john.doe@example.com' }),
    ).rejects.toThrow(UserAlreadyExistsError);

    expect(sut.userRepository.all()).toHaveLength(1);
    expect(sut.passwordTokenRepository.all()).toHaveLength(0);
    expect(sut.eventDispatcher.events).toHaveLength(0);
  });

  it('rejects a malformed e-mail before persisting anything', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ name: 'John', email: 'invalid' })).rejects.toThrow(
      'Invalid email format',
    );

    expect(sut.userRepository.all()).toHaveLength(0);
  });

  it('rejects an empty name', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ name: '', email: 'john@example.com' })).rejects.toThrow(
      'Name is required',
    );

    expect(sut.userRepository.all()).toHaveLength(0);
  });
});
