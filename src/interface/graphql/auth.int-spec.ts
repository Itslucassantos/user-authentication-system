import type { Express } from 'express';
import { useIntegrationInfrastructure } from '../../@testing/integration/lifecycle.js';
import {
  createGraphQLApp,
  gql,
  login,
  loginAdmin,
} from '../../@testing/integration/graphql-client.js';
import { createTenant, type Tenant } from '../../@testing/integration/tenant.js';

const REFRESH = /* GraphQL */ `
  mutation ($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;
const LOGOUT = /* GraphQL */ `
  mutation ($refreshToken: String!) {
    logout(refreshToken: $refreshToken)
  }
`;

describe('GraphQL auth (real PostgreSQL + Redis)', () => {
  let app: Express;
  let tenant: Tenant;

  useIntegrationInfrastructure();
  beforeAll(async () => {
    app = await createGraphQLApp();
  });
  beforeEach(async () => {
    tenant = await createTenant('Back Office');
  });

  it('logs in with valid credentials and resolves `me` from the access token', async () => {
    const { accessToken, refreshToken } = await loginAdmin(app, tenant);
    expect(refreshToken).toEqual(expect.any(String));

    const me = await gql(app, '{ me { id email active } }', { token: accessToken });
    expect(me.errors).toBeUndefined();
    expect(me.data?.me).toEqual({ id: tenant.admin.id, email: tenant.admin.email, active: true });
  });

  it('returns the same UNAUTHENTICATED error for wrong password and unknown email', async () => {
    const wrongPassword = await login(app, tenant, tenant.admin.email, 'WrongPass123');
    const unknownEmail = await login(app, tenant, 'nobody@example.com', 'WrongPass123');

    expect(wrongPassword.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(unknownEmail.errors?.[0]).toEqual(wrongPassword.errors?.[0]);
  });

  it('rejects an unknown clientId', async () => {
    const response = await login(
      app,
      { clientId: 'does-not-exist' },
      tenant.admin.email,
      tenant.admin.password,
    );
    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('rejects login for an invited user that has not set a password yet', async () => {
    const { accessToken } = await loginAdmin(app, tenant);
    const created = await gql(
      app,
      `mutation { createUser(input: { name: "Bob", email: "bob@example.com" }) { id } }`,
      { token: accessToken },
    );
    expect(created.errors).toBeUndefined();

    const response = await login(app, tenant, 'bob@example.com', 'Whatever123');
    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  describe('refresh token rotation', () => {
    it('issues a new pair and rejects the rotated token afterwards', async () => {
      const first = await loginAdmin(app, tenant);

      const rotated = await gql(app, REFRESH, { variables: { refreshToken: first.refreshToken } });
      expect(rotated.errors).toBeUndefined();
      const second = rotated.data?.refreshToken;
      expect(second.refreshToken).not.toBe(first.refreshToken);

      const reused = await gql(app, REFRESH, { variables: { refreshToken: first.refreshToken } });
      expect(reused.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('terminates every session when a rotated token is reused', async () => {
      const first = await loginAdmin(app, tenant);
      const second = (await gql(app, REFRESH, { variables: { refreshToken: first.refreshToken } }))
        .data?.refreshToken;

      await gql(app, REFRESH, { variables: { refreshToken: first.refreshToken } }); // reuse
      const afterReuse = await gql(app, REFRESH, {
        variables: { refreshToken: second.refreshToken },
      });
      expect(afterReuse.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    });
  });

  it('logout invalidates only that refresh token', async () => {
    const deviceA = await loginAdmin(app, tenant);
    const deviceB = await loginAdmin(app, tenant);

    const out = await gql(app, LOGOUT, { variables: { refreshToken: deviceA.refreshToken } });
    expect(out.data?.logout).toBe(true);

    const a = await gql(app, REFRESH, { variables: { refreshToken: deviceA.refreshToken } });
    const b = await gql(app, REFRESH, { variables: { refreshToken: deviceB.refreshToken } });
    expect(a.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(b.errors).toBeUndefined();
  });

  it('logoutAllDevices invalidates every session of the user', async () => {
    const deviceA = await loginAdmin(app, tenant);
    const deviceB = await loginAdmin(app, tenant);

    const out = await gql(app, 'mutation { logoutAllDevices }', { token: deviceA.accessToken });
    expect(out.data?.logoutAllDevices).toBe(true);

    for (const device of [deviceA, deviceB]) {
      const response = await gql(app, REFRESH, {
        variables: { refreshToken: device.refreshToken },
      });
      expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    }
  });

  it('logoutAllDevices requires authentication', async () => {
    const response = await gql(app, 'mutation { logoutAllDevices }');
    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('blocks login after 5 failed attempts for the same email (rate limit in Redis)', async () => {
    for (let i = 0; i < 5; i += 1) {
      const response = await login(app, tenant, tenant.admin.email, 'WrongPass123');
      expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    }

    // even the right password is refused while blocked
    const blocked = await login(app, tenant, tenant.admin.email, tenant.admin.password);
    expect(blocked.errors?.[0]?.extensions?.code).toBe('TOO_MANY_REQUESTS');
    expect(blocked.errors?.[0]?.extensions?.retryAfterSeconds).toBeGreaterThan(0);
  });
});
