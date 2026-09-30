import { makeClientApplication } from '../../../@testing/builders.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import DeleteClientApplicationUseCase from './delete-client-application.use-case.js';

describe('DeleteClientApplicationUseCase', () => {
  it('removes only the requested application', async () => {
    const repository = new InMemoryClientApplicationRepository().seed(
      makeClientApplication({ id: 'app-1', name: 'One' }),
      makeClientApplication({ id: 'app-2', name: 'Two' }),
    );

    await new DeleteClientApplicationUseCase(repository).execute({ clientApplicationId: 'app-1' });

    expect(repository.all().map((app) => app.id)).toEqual(['app-2']);
  });

  it('propagates the not found error raised by the repository', async () => {
    const useCase = new DeleteClientApplicationUseCase(new InMemoryClientApplicationRepository());

    await expect(useCase.execute({ clientApplicationId: 'missing' })).rejects.toThrow(
      ClientApplicationNotFoundError,
    );
  });
});
