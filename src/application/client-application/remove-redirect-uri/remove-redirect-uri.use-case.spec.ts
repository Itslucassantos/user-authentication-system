import { makeClientApplication } from '../../../@testing/builders.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import RemoveRedirectUriUseCase from './remove-redirect-uri.use-case.js';

const FIRST = 'https://app.example.com/callback';
const SECOND = 'https://other.example.com/cb';

const makeSut = (redirectUris = [FIRST, SECOND]) => {
  const repository = new InMemoryClientApplicationRepository().seed(
    makeClientApplication({ id: 'app-1', redirectUris }),
  );
  return { useCase: new RemoveRedirectUriUseCase(repository), repository };
};

describe('RemoveRedirectUriUseCase', () => {
  it('removes the URI, persists it and returns the new list', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ clientApplicationId: 'app-1', redirectUri: FIRST });

    expect(output.redirectUris).toEqual([SECOND]);
    expect((await sut.repository.findById('app-1'))?.redirectUris).toEqual([SECOND]);
  });

  it('refuses to remove the last redirect URI and keeps the stored state', async () => {
    const sut = makeSut([FIRST]);

    await expect(
      sut.useCase.execute({ clientApplicationId: 'app-1', redirectUri: FIRST }),
    ).rejects.toThrow('At least one redirect URI is required');

    expect((await sut.repository.findById('app-1'))?.redirectUris).toEqual([FIRST]);
  });

  it('fails when the application does not exist', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ clientApplicationId: 'missing', redirectUri: FIRST }),
    ).rejects.toThrow(ClientApplicationNotFoundError);
  });
});
