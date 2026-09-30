import { makeClientApplication } from '../../../@testing/builders.js';
import FakeHasher from '../../../@testing/fakes/fake-hasher.js';
import InMemoryClientApplicationRepository from '../../../@testing/fakes/in-memory-client-application.repository.js';
import ClientApplicationNotFoundError from '../../../domain/client-application/error/client-application-not-found-error.js';
import RotateClientSecretUseCase from './rotate-client-secret.use-case.js';

const makeSut = () => {
  const repository = new InMemoryClientApplicationRepository().seed(
    makeClientApplication({ id: 'app-1', clientSecretHash: 'hashed:old-secret' }),
  );
  return { useCase: new RotateClientSecretUseCase(repository, new FakeHasher()), repository };
};

describe('RotateClientSecretUseCase', () => {
  it('stores the hash of a brand new secret and reveals the secret once', async () => {
    const sut = makeSut();

    const { clientSecret } = await sut.useCase.execute({ clientApplicationId: 'app-1' });

    expect(clientSecret).toMatch(/^[0-9a-f]{64}$/);
    const stored = await sut.repository.findById('app-1');
    expect(stored?.clientSecretHash).toBe(`hashed:${clientSecret}`);
    expect(stored?.clientSecretHash).not.toBe('hashed:old-secret');
  });

  it('generates a different secret on every rotation', async () => {
    const sut = makeSut();

    const first = await sut.useCase.execute({ clientApplicationId: 'app-1' });
    const second = await sut.useCase.execute({ clientApplicationId: 'app-1' });

    expect(first.clientSecret).not.toBe(second.clientSecret);
  });

  it('returns the application without secret material', async () => {
    const sut = makeSut();

    const { clientApplication } = await sut.useCase.execute({ clientApplicationId: 'app-1' });

    expect(clientApplication).toMatchObject({ id: 'app-1', name: 'Back Office' });
    expect(clientApplication).not.toHaveProperty('clientSecretHash');
  });

  it('fails when the application does not exist', async () => {
    const sut = makeSut();

    await expect(sut.useCase.execute({ clientApplicationId: 'missing' })).rejects.toThrow(
      ClientApplicationNotFoundError,
    );
  });
});
