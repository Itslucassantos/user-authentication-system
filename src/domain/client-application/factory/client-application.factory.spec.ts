import ClientApplicationFactory from './client-application.factory.js';

const URIS = ['https://app.example.com/callback'];

describe('ClientApplicationFactory', () => {
  it('create builds an active application with a generated id', () => {
    const a = ClientApplicationFactory.create('Back Office', 'client-id', 'hash', URIS);
    const b = ClientApplicationFactory.create('Back Office', 'client-id', 'hash', URIS);

    expect(a.active).toBe(true);
    expect(a.id).not.toBe(b.id);
  });

  it('restore keeps the persisted id and active flag', () => {
    const application = ClientApplicationFactory.restore('app-1', 'n', 'c', 'h', URIS, false);

    expect(application).toMatchObject({ id: 'app-1', active: false });
  });

  it('restore keeps an active application active', () => {
    expect(ClientApplicationFactory.restore('app-1', 'n', 'c', 'h', URIS, true).active).toBe(true);
  });
});
