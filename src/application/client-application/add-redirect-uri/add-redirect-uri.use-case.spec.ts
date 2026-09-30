import { makeClientApplication } from '../../../@testing/builders.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import AddRedirectUriUseCase from './add-redirect-uri.use-case.js';

const EXISTING = 'https://app.example.com/callback';

const makeSut = () => {
  const repository = new InMemoryClientApplicationRepository().seed(
    makeClientApplication({ id: 'app-1', redirectUris: [EXISTING] }),
  );
  return { useCase: new AddRedirectUriUseCase(repository), repository };
};

describe('AddRedirectUriUseCase', () => {
  it('adds the URI, persists it and returns the new list', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({
      clientApplicationId: 'app-1',
      redirectUri: 'https://other.example.com/cb',
    });

    expect(output.redirectUris).toEqual([EXISTING, 'https://other.example.com/cb']);
    expect((await sut.repository.findById('app-1'))?.redirectUris).toEqual(output.redirectUris);
  });

  it('is idempotent when the URI is already registered', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({
      clientApplicationId: 'app-1',
      redirectUri: EXISTING,
    });

    expect(output.redirectUris).toEqual([EXISTING]);
  });

  it('fails when the application does not exist', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ clientApplicationId: 'missing', redirectUri: EXISTING }),
    ).rejects.toThrow(ClientApplicationNotFoundError);
  });
});
