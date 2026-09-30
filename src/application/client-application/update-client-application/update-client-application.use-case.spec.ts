import { makeClientApplication } from '../../../@testing/builders.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import ClientApplicationAlreadyExistsError from '../../../domain/client-application/error/client-application-already-exists-error.js';
import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import UpdateClientApplicationUseCase from './update-client-application.use-case.js';

const makeSut = () => {
  const repository = new InMemoryClientApplicationRepository().seed(
    makeClientApplication({ id: 'app-1', name: 'One', clientId: 'c1' }),
    makeClientApplication({ id: 'app-2', name: 'Two', clientId: 'c2' }),
  );
  return { useCase: new UpdateClientApplicationUseCase(repository), repository };
};

describe('UpdateClientApplicationUseCase', () => {
  it('renames the application, persists it and returns the new state', async () => {
    const sut = makeSut();

    const output = await sut.useCase.execute({ clientApplicationId: 'app-1', name: 'Portal' });

    expect(output.name).toBe('Portal');
    expect((await sut.repository.findById('app-1'))?.name).toBe('Portal');
  });

  it('lets the application keep its own name', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ clientApplicationId: 'app-1', name: 'One' }),
    ).resolves.toMatchObject({ name: 'One' });
  });

  it('refuses a name already used by another application', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ clientApplicationId: 'app-1', name: 'Two' }),
    ).rejects.toThrow(ClientApplicationAlreadyExistsError);
    expect((await sut.repository.findById('app-1'))?.name).toBe('One');
  });

  it('rejects an empty name', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ clientApplicationId: 'app-1', name: '' })).rejects.toThrow(
      'Client Application name is required',
    );
  });

  it('fails when the application does not exist', async () => {
    const sut = makeSut();

    await expect(
      sut.useCase.execute({ clientApplicationId: 'missing', name: 'Portal' }),
    ).rejects.toThrow(ClientApplicationNotFoundError);
  });
});
