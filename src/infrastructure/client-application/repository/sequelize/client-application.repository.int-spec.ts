import { makeClientApplication } from '../../../../@testing/builders.js';
import { useIntegrationInfrastructure } from '../../../../@testing/integration/lifecycle.js';
import ClientApplicationAlreadyExistsError from '../../../../domain/client-application/error/client-application-already-exists-error.js';
import ClientApplicationNotFoundError from '../../../../domain/client-application/error/client-application-not-found-error.js';
import ClientApplicationRepository from './client-application.repository.js';

const app = (n: number, overrides = {}) =>
  makeClientApplication({
    id: `00000000-0000-4000-8000-00000000000${n}`,
    name: `App ${n}`,
    clientId: `client-${n}`,
    ...overrides,
  });

describe('ClientApplicationRepository (PostgreSQL)', () => {
  useIntegrationInfrastructure();
  const repository = new ClientApplicationRepository();

  it('saves and finds by id, name and clientId, keeping redirect URIs', async () => {
    const entity = app(1, {
      redirectUris: ['https://a.example.com/cb', 'https://b.example.com/cb'],
    });
    await repository.save(entity);

    for (const found of [
      await repository.findById(entity.id),
      await repository.findByName('App 1'),
      await repository.findByClientId('client-1'),
    ]) {
      expect(found).toMatchObject({ id: entity.id, name: 'App 1', active: true });
      expect(found?.redirectUris).toEqual(['https://a.example.com/cb', 'https://b.example.com/cb']);
    }
    expect(await repository.findByClientId('missing')).toBeNull();
  });

  it('rejects a duplicate name', async () => {
    await repository.save(app(1));
    await expect(repository.save(app(2, { name: 'App 1' }))).rejects.toBeInstanceOf(
      ClientApplicationAlreadyExistsError,
    );
  });

  it('updates secret hash, URIs, name and active flag', async () => {
    const entity = app(1);
    await repository.save(entity);

    entity.rotateClientSecret('new-secret-hash');
    entity.addRedirectUri('https://new.example.com/cb');
    entity.changeName('Renamed');
    entity.deactivate();
    await repository.update(entity);

    const found = await repository.findById(entity.id);
    expect(found).toMatchObject({
      name: 'Renamed',
      clientSecretHash: 'new-secret-hash',
      active: false,
    });
    expect(found?.redirectUris).toContain('https://new.example.com/cb');
  });

  it('throws ClientApplicationNotFoundError on update/delete of a missing record', async () => {
    await expect(repository.update(app(1))).rejects.toBeInstanceOf(ClientApplicationNotFoundError);
    await expect(repository.delete(app(1).id)).rejects.toBeInstanceOf(
      ClientApplicationNotFoundError,
    );
  });

  it('deletes and paginates', async () => {
    for (const n of [1, 2, 3]) await repository.save(app(n));
    await repository.delete(app(3).id);

    const page = await repository.findAll({ page: 1, limit: 1 });
    expect(page).toMatchObject({ total: 2, totalPages: 2, limit: 1 });
    expect(page.items).toHaveLength(1);
  });
});
