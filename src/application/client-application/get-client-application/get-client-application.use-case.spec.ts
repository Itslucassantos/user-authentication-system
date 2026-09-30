import { makeClientApplication } from '../../../@testing/builders.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import GetClientApplicationUseCase from './get-client-application.use-case.js';

describe('GetClientApplicationUseCase', () => {
  it('returns the application without any secret material', async () => {
    const repository = new InMemoryClientApplicationRepository().seed(
      makeClientApplication({
        id: 'app-1',
        name: 'Back Office',
        clientId: 'client-id-1',
        redirectUris: ['https://app.example.com/callback'],
      }),
    );

    const output = await new GetClientApplicationUseCase(repository).execute({
      clientApplicationId: 'app-1',
    });

    expect(output).toEqual({
      id: 'app-1',
      name: 'Back Office',
      clientId: 'client-id-1',
      redirectUris: ['https://app.example.com/callback'],
      active: true,
    });
  });

  it('returns null when the application does not exist', async () => {
    const useCase = new GetClientApplicationUseCase(new InMemoryClientApplicationRepository());

    expect(await useCase.execute({ clientApplicationId: 'missing' })).toBeNull();
  });
});
