import type { Express } from 'express';
import { createGraphQLApp, gql, loginAdmin } from '../../@testing/integration/graphql-client.js';
import { useIntegrationInfrastructure } from '../../@testing/integration/lifecycle.js';
import { createTenant } from '../../@testing/integration/tenant.js';

const USERS = '{ users { items { id } } }';

describe('GraphQL authentication and authorization directives (real PostgreSQL + Redis)', () => {
  let app: Express;

  useIntegrationInfrastructure();
  beforeAll(async () => {
    app = await createGraphQLApp();
  });

  it('answers UNAUTHENTICATED to a protected field without a token', async () => {
    const response = await gql(app, USERS);
    expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it.each(['garbage', 'a.b.c'])(
    'treats the invalid bearer token "%s" as anonymous',
    async (token) => {
      const response = await gql(app, USERS, { token });
      expect(response.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    },
  );

  it('resolves `me` for a valid token and returns null for anonymous callers', async () => {
    const tenant = await createTenant('Back Office');
    const { accessToken } = await loginAdmin(app, tenant);

    const authenticated = await gql(app, '{ me { id } }', { token: accessToken });
    expect(authenticated.data?.me?.id).toBe(tenant.admin.id);

    const anonymous = await gql(app, '{ me { id } }');
    expect(anonymous.errors).toBeUndefined();
    expect(anonymous.data?.me).toBeNull();
  });

  it('answers FORBIDDEN naming the missing permission', async () => {
    const tenant = await createTenant('Limited', { permissions: [['user', 'read']] });
    const { accessToken } = await loginAdmin(app, tenant);

    const allowed = await gql(app, USERS, { token: accessToken });
    expect(allowed.errors).toBeUndefined();

    const denied = await gql(
      app,
      `mutation { createUser(input: { name: "X", email: "x@example.com" }) { id } }`,
      { token: accessToken },
    );
    expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    expect(denied.errors?.[0]?.message).toContain('user:create');
  });

  it('reflects permission changes only after the next login (permissions live in the token)', async () => {
    const tenant = await createTenant('Back Office');
    const { accessToken } = await loginAdmin(app, tenant);

    await gql(app, `mutation ($id: ID!) { deleteRole(id: $id) }`, {
      variables: { id: tenant.roleId },
      token: accessToken,
    });

    // old token keeps working until it expires
    expect((await gql(app, USERS, { token: accessToken })).errors).toBeUndefined();

    // a fresh login no longer carries the permissions
    const fresh = await loginAdmin(app, tenant);
    const denied = await gql(app, USERS, { token: fresh.accessToken });
    expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });

  it('exposes introspection outside production', async () => {
    const response = await gql(app, '{ __schema { queryType { name } } }');
    expect(response.data?.__schema.queryType.name).toBe('Query');
  });
});
