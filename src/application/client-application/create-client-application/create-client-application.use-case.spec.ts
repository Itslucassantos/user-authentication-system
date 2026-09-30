import { makeClientApplication } from '../../../@testing/builders.js';
import FakeHasher from '../../../@testing/fakes/fake-hasher.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import ClientApplicationAlreadyExistsError from '../../../domain/client-application/error/client-application-already-exists-error.js';
import CreateClientApplicationUseCase from './create-client-application.use-case.js';

const input = { name: 'Back Office', redirectUris: ['https://app.example.com/callback'] };

const makeSut = () => {
  const clientApplicationRepository = new InMemoryClientApplicationRepository();
  const useCase = new CreateClientApplicationUseCase(clientApplicationRepository, new FakeHasher());
  return { useCase, clientApplicationRepository };
};

describe('CreateClientApplicationUseCase', () => {
  it('creates an active application with a generated client id', async () => {
    const sut = makeSut();

    const { clientApplication } = await sut.useCase.execute(input);

    expect(clientApplication).toEqual({
      id: expect.any(String),
      name: 'Back Office',
      clientId: expect.any(String),
      redirectUris: ['https://app.example.com/callback'],
      active: true,
    });
    expect(await sut.clientApplicationRepository.findById(clientApplication.id)).not.toBeNull();
  });

  it('reveals the client secret once and stores only its hash', async () => {
    const sut = makeSut();

    const { clientApplication, clientSecret } = await sut.useCase.execute(input);

    expect(clientSecret).toMatch(/^[0-9a-f]{64}$/);
    const stored = await sut.clientApplicationRepository.findById(clientApplication.id);
    expect(stored?.clientSecretHash).toBe(`hashed:${clientSecret}`);
    expect(stored?.clientSecretHash).not.toBe(clientSecret);
  });

  it('never leaks the secret hash in the output', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute(input);

    expect(output.clientApplication).not.toHaveProperty('clientSecretHash');
  });

  it('refuses a duplicated name', async () => {
    const sut = makeSut();
    sut.clientApplicationRepository.seed(makeClientApplication({ name: 'Back Office' }));

    await expect(sut.useCase.execute(input)).rejects.toThrow(ClientApplicationAlreadyExistsError);
    expect(sut.clientApplicationRepository.all()).toHaveLength(1);
  });

  it('requires at least one redirect URI', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ name: 'Back Office', redirectUris: [] })).rejects.toThrow(
      'At least one redirect URI is required',
    );
    expect(sut.clientApplicationRepository.all()).toHaveLength(0);
  });
});
