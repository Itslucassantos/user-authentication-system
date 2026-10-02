import type { Express } from 'express';
import {
  createGraphQLApp,
  gql,
  loginAdmin,
  login,
} from '../../@testing/integration/graphql-client.js';
import { useIntegrationInfrastructure } from '../../@testing/integration/lifecycle.js';
import { createTenant, type Tenant } from '../../@testing/integration/tenant.js';
import { repositories } from '../../container/index.js';

/**
 * A token issued for application A must never read or change application B's data
 * (README → "Multi-tenant isolation"), exercised through the real HTTP API.
 */
describe('GraphQL multi-tenant isolation (real PostgreSQL + Redis)', () => {
  let app: Express;
  let a: Tenant;
  let b: Tenant;
  let tokenA: string;
  let permissionB: string;

  useIntegrationInfrastructure();
  beforeAll(async () => {
    app = await createGraphQLApp();
  });
  beforeEach(async () => {
    a = await createTenant('Tenant A', { adminEmail: 'admin-a@example.com' });
    b = await createTenant('Tenant B', { adminEmail: 'admin-b@example.com' });
    tokenA = (await loginAdmin(app, a)).accessToken;
    const [first] = (await repositories.role.findById(b.roleId))!.permissions;
    permissionB = first!.id;
  });

  const codes = (response: Awaited<ReturnType<typeof gql>>) =>
    response.errors?.map((error) => error.extensions?.code);

  describe('explicit clientApplicationId argument', () => {
    it.each([
      ['roles', (id: string) => `{ roles(clientApplicationId: "${id}") { items { id } } }`],
      [
        'permissions',
        (id: string) => `{ permissions(clientApplicationId: "${id}") { items { id } } }`,
      ],
      ['users', (id: string) => `{ users(clientApplicationId: "${id}") { items { id } } }`],
    ])('%s of another tenant → FORBIDDEN', async (_name, build) => {
      const response = await gql(app, build(b.clientApplicationId), { token: tokenA });
      expect(codes(response)).toEqual(['FORBIDDEN']);
    });

    it('createRole / createPermission in another tenant → FORBIDDEN', async () => {
      const role = await gql(
        app,
        `mutation { createRole(name: "x", description: "x", clientApplicationId: "${b.clientApplicationId}", permissionIds: ["${permissionB}"]) { id } }`,
        { token: tokenA },
      );
      const permission = await gql(
        app,
        `mutation { createPermission(clientApplicationId: "${b.clientApplicationId}", name: "n", resource: "r", action: "a") { id } }`,
        { token: tokenA },
      );
      expect(codes(role)).toEqual(['FORBIDDEN']);
      expect(codes(permission)).toEqual(['FORBIDDEN']);
      expect(await repositories.role.findByName(b.clientApplicationId, 'x')).toBeNull();
    });

    it('assign / remove roles scoped to another tenant → FORBIDDEN', async () => {
      for (const field of ['assignRolesToUser', 'removeRolesFromUser']) {
        const response = await gql(
          app,
          `mutation { ${field}(userId: "${a.admin.id}", roleIds: ["${b.roleId}"], clientApplicationId: "${b.clientApplicationId}") { id } }`,
          { token: tokenA },
        );
        expect(codes(response)).toEqual(['FORBIDDEN']);
      }
    });

    it('User.roles for another tenant → FORBIDDEN', async () => {
      const response = await gql(
        app,
        `{ me { roles(clientApplicationId: "${b.clientApplicationId}") { id } } }`,
        { token: tokenA },
      );
      expect(codes(response)).toEqual(['FORBIDDEN']);
    });
  });

  describe('resources loaded by id', () => {
    it('role(id) and permission(id) of another tenant look like they do not exist', async () => {
      const role = await gql(app, `{ role(id: "${b.roleId}") { id } }`, { token: tokenA });
      const permission = await gql(app, `{ permission(id: "${permissionB}") { id } }`, {
        token: tokenA,
      });
      expect(role.errors).toBeUndefined();
      expect(role.data?.role).toBeNull();
      expect(permission.data?.permission).toBeNull();

      const own = await gql(app, `{ role(id: "${a.roleId}") { id } }`, { token: tokenA });
      expect(own.data?.role?.id).toBe(a.roleId);
    });

    it('mutations by id on another tenant → NOT_FOUND, and nothing changes', async () => {
      const attempts = [
        `mutation { updateRole(id: "${b.roleId}", name: "hacked", description: "x") { id } }`,
        `mutation { assignPermissionsToRole(roleId: "${b.roleId}", permissionIds: ["${permissionB}"]) { id } }`,
        `mutation { deleteRole(id: "${b.roleId}") }`,
        `mutation { updatePermission(id: "${permissionB}", description: "hacked") { id } }`,
        `mutation { deletePermission(id: "${permissionB}") }`,
      ];
      for (const mutation of attempts) {
        expect(codes(await gql(app, mutation, { token: tokenA }))).toEqual(['NOT_FOUND']);
      }

      const role = await repositories.role.findById(b.roleId);
      expect(role?.name).toBe('admin');
      expect((await repositories.permission.findById(permissionB))?.description).not.toBe('hacked');
    });
  });

  describe('defaults', () => {
    it('users lists only the token tenant when the argument is omitted', async () => {
      const response = await gql(app, '{ users { items { email } pageInfo { total } } }', {
        token: tokenA,
      });
      expect(response.data?.users.items).toEqual([{ email: 'admin-a@example.com' }]);
      expect(response.data?.users.pageInfo.total).toBe(1);
    });

    it('User.roles defaults to the token tenant', async () => {
      const response = await gql(app, '{ me { roles { id } } }', { token: tokenA });
      expect(response.data?.me.roles).toEqual([{ id: a.roleId }]);
    });

    it('roles and permissions of the own tenant never include the other one', async () => {
      const roles = await gql(
        app,
        `{ roles(clientApplicationId: "${a.clientApplicationId}") { items { id clientApplicationId } } }`,
        { token: tokenA },
      );
      expect(roles.data?.roles.items).toEqual([
        { id: a.roleId, clientApplicationId: a.clientApplicationId },
      ]);

      const permissions = await gql(
        app,
        `{ permissions(clientApplicationId: "${a.clientApplicationId}", limit: 50) { items { clientApplicationId } pageInfo { total } } }`,
        { token: tokenA },
      );
      expect(permissions.data?.permissions.pageInfo.total).toBe(17);
      expect(
        permissions.data?.permissions.items.every(
          (item: { clientApplicationId: string }) =>
            item.clientApplicationId === a.clientApplicationId,
        ),
      ).toBe(true);
    });
  });

  describe('login', () => {
    it('a user cannot log in through another tenant client id with no role there', async () => {
      const response = await login(app, b, a.admin.email, a.admin.password);
      // either refused outright, or issued a token carrying no permission of tenant B
      if (response.errors) {
        expect(codes(response)).toEqual(['UNAUTHENTICATED']);
        return;
      }
      const roles = await gql(
        app,
        `{ roles(clientApplicationId: "${b.clientApplicationId}") { items { id } } }`,
        { token: response.data?.login.accessToken },
      );
      expect(roles.data?.roles?.items ?? []).toEqual([]);
    });

    it('tokens are bound to their tenant: the same user holds different permissions per tenant', async () => {
      const [read] = (await repositories.role.findById(b.roleId))!.permissions.filter(
        (p) => p.resource === 'role' && p.action === 'read',
      );
      expect(read?.clientApplicationId).toBe(b.clientApplicationId);

      const tokenB = (await loginAdmin(app, b)).accessToken;
      const ownB = await gql(
        app,
        `{ roles(clientApplicationId: "${b.clientApplicationId}") { items { id } } }`,
        { token: tokenB },
      );
      expect(ownB.errors).toBeUndefined();

      const bToA = await gql(
        app,
        `{ roles(clientApplicationId: "${a.clientApplicationId}") { items { id } } }`,
        { token: tokenB },
      );
      expect(codes(bToA)).toEqual(['FORBIDDEN']);
    });
  });
});
