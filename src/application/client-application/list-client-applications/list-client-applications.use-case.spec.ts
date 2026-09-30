import { makeClientApplication } from '../../../@testing/builders.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import ListClientApplicationsUseCase from './list-client-applications.use-case.js';

const makeSut = () => {
  const repository = new InMemoryClientApplicationRepository().seed(
    makeClientApplication({ id: 'app-1', name: 'One', clientId: 'c1' }),
    makeClientApplication({ id: 'app-2', name: 'Two', clientId: 'c2' }),
    makeClientApplication({ id: 'app-3', name: 'Three', clientId: 'c3' }),
  );
  return new ListClientApplicationsUseCase(repository);
};

describe('ListClientApplicationsUseCase', () => {
  it('lists the applications with pagination metadata', async () => {
    const output = await makeSut().execute({ page: 1, limit: 10 });

    expect(output.items.map((app) => app.id)).toEqual(['app-1', 'app-2', 'app-3']);
    expect(output).toMatchObject({ total: 3, page: 1, limit: 10, totalPages: 1 });
  });

  it('paginates the results', async () => {
    const output = await makeSut().execute({ page: 2, limit: 2 });

    expect(output.items.map((app) => app.id)).toEqual(['app-3']);
    expect(output).toMatchObject({ total: 3, page: 2, limit: 2, totalPages: 2 });
  });

  it('never exposes the secret hash', async () => {
    const output = await makeSut().execute({ page: 1, limit: 1 });

    expect(output.items[0]).not.toHaveProperty('clientSecretHash');
  });
});
