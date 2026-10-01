import { makeRole } from '../../../@testing/builders.js';
import ClientApplication from './client-application.js';

const URI = 'https://app.example.com/callback';

const makeNewApplication = (redirectUris = [URI]) =>
  new ClientApplication('app-1', 'Back Office', 'client-id', 'secret-hash', redirectUris);

describe('ClientApplication', () => {
  describe('creation', () => {
    it('starts active and without roles', () => {
      const application = makeNewApplication();

      expect(application).toMatchObject({
        id: 'app-1',
        name: 'Back Office',
        clientId: 'client-id',
        clientSecretHash: 'secret-hash',
        active: true,
        redirectUris: [URI],
      });
      expect(application.roles).toEqual([]);
    });

    it('keeps the given roles', () => {
      const role = makeRole();

      const application = new ClientApplication('app-1', 'n', 'c', 's', [URI], [role]);

      expect(application.roles).toEqual([role]);
    });

    it.each([
      ['Client Application ID', () => new ClientApplication('', 'n', 'c', 's', [URI])],
      ['Client Application name', () => new ClientApplication('id', '', 'c', 's', [URI])],
      ['Client ID', () => new ClientApplication('id', 'n', '', 's', [URI])],
      ['Client Secret Hash', () => new ClientApplication('id', 'n', 'c', '', [URI])],
    ])('requires the %s', (field, build) => {
      expect(build).toThrow(`${field} is required`);
    });

    it('requires at least one redirect URI', () => {
      expect(() => makeNewApplication([])).toThrow('At least one redirect URI is required');
    });
  });

  it('toggles the active flag', () => {
    const application = makeNewApplication();

    application.deactivate();
    expect(application.active).toBe(false);

    application.activate();
    expect(application.active).toBe(true);
  });

  describe('changeName', () => {
    it('changes the name', () => {
      const application = makeNewApplication();

      application.changeName('Portal');

      expect(application.name).toBe('Portal');
    });

    it('rejects an empty name', () => {
      expect(() => makeNewApplication().changeName('')).toThrow(
        'Client Application name is required',
      );
    });
  });

  it('rotates the client secret hash', () => {
    const application = makeNewApplication();

    application.rotateClientSecret('new-hash');

    expect(application.clientSecretHash).toBe('new-hash');
  });

  describe('redirect URIs', () => {
    it('adds a new URI', () => {
      const application = makeNewApplication();

      application.addRedirectUri('https://other.example.com/cb');

      expect(application.redirectUris).toEqual([URI, 'https://other.example.com/cb']);
    });

    it('is idempotent when the URI is already registered', () => {
      const application = makeNewApplication();

      application.addRedirectUri(URI);

      expect(application.redirectUris).toEqual([URI]);
    });

    it('removes a URI', () => {
      const application = makeNewApplication([URI, 'https://other.example.com/cb']);

      application.removeRedirectUri(URI);

      expect(application.redirectUris).toEqual(['https://other.example.com/cb']);
    });

    it('never removes the last URI', () => {
      const application = makeNewApplication();

      expect(() => application.removeRedirectUri(URI)).toThrow(
        'At least one redirect URI is required',
      );
      expect(application.redirectUris).toEqual([URI]);
    });

    it('removing an unknown URI leaves the list untouched', () => {
      const application = makeNewApplication();

      application.removeRedirectUri('https://unknown.example.com');

      expect(application.redirectUris).toEqual([URI]);
    });

    it('hasRedirectUri only accepts exact matches', () => {
      const application = makeNewApplication();

      expect(application.hasRedirectUri(URI)).toBe(true);
      expect(application.hasRedirectUri(`${URI}/extra`)).toBe(false);
    });
  });
});
