import {
  CLIENT_APPLICATION_ID,
  OTHER_CLIENT_APPLICATION_ID,
  makePermission,
  makeRole,
  makeUser,
} from '../../../@testing/builders.js';
import { toAccessTokenPayload, toAuthPayloadOutputDto } from './auth-payload-output.dto.js';

describe('toAccessTokenPayload', () => {
  it('lists the roles and permissions of the client application as resource:action', () => {
    const user = makeUser({
      id: 'user-1',
      roles: [
        makeRole({
          name: 'admin',
          permissions: [
            makePermission({ resource: 'users', action: 'read' }),
            makePermission({ resource: 'users', action: 'write' }),
          ],
        }),
      ],
    });

    expect(toAccessTokenPayload(user, CLIENT_APPLICATION_ID)).toEqual({
      sub: 'user-1',
      clientApplicationId: CLIENT_APPLICATION_ID,
      roles: ['admin'],
      permissions: ['users:read', 'users:write'],
    });
  });

  it('removes duplicated permissions granted by more than one role', () => {
    const sharedPermission = { resource: 'users', action: 'read' };
    const user = makeUser({
      roles: [
        makeRole({ name: 'admin', permissions: [makePermission(sharedPermission)] }),
        makeRole({ name: 'auditor', permissions: [makePermission(sharedPermission)] }),
      ],
    });

    const payload = toAccessTokenPayload(user, CLIENT_APPLICATION_ID);

    expect(payload.roles).toEqual(['admin', 'auditor']);
    expect(payload.permissions).toEqual(['users:read']);
  });

  it('ignores roles that belong to other client applications (multi-tenant isolation)', () => {
    const user = makeUser({
      roles: [
        makeRole({ name: 'own' }),
        makeRole({
          name: 'foreign',
          clientApplicationId: OTHER_CLIENT_APPLICATION_ID,
          permissions: [
            makePermission({
              clientApplicationId: OTHER_CLIENT_APPLICATION_ID,
              resource: 'billing',
              action: 'delete',
            }),
          ],
        }),
      ],
    });

    const payload = toAccessTokenPayload(user, CLIENT_APPLICATION_ID);

    expect(payload.roles).toEqual(['own']);
    expect(payload.permissions).not.toContain('billing:delete');
  });

  it('returns empty lists for a user without roles', () => {
    const payload = toAccessTokenPayload(makeUser(), CLIENT_APPLICATION_ID);

    expect(payload).toMatchObject({ roles: [], permissions: [] });
  });
});

describe('toAuthPayloadOutputDto', () => {
  it('exposes the tokens and only the public user data', () => {
    const user = makeUser({ id: 'user-1', name: 'John Doe', email: 'john@example.com' });

    const output = toAuthPayloadOutputDto(user, 'access', 'refresh');

    expect(output).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com', active: true },
    });
  });
});
