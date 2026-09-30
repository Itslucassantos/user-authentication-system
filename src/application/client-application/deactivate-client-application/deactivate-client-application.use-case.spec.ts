import { makeClientApplication } from '../../../@testing/builders.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import DeactivateClientApplicationUseCase from './deactivate-client-application.use-case.js';

describe('DeactivateClientApplicationUseCase', () => {
  it('deactivates and persists the application', async () => {
    const repository = new InMemoryClientApplicationRepository().seed(
      makeClientApplication({ id: 'app-1', active: true }),
    );

    await new DeactivateClientApplicationUseCase(repository).execute({
      clientApplicationId: 'app-1',
    });

    expect((await repository.findById('app-1'))?.active).toBe(false);
  });

  it('fails when the application does not exist', async () => {
    const useCase = new DeactivateClientApplicationUseCase(
      new InMemoryClientApplicationRepository(),
    );

    await expect(useCase.execute({ clientApplicationId: 'missing' })).rejects.toThrow(
      ClientApplicationNotFoundError,
    );
  });
});
