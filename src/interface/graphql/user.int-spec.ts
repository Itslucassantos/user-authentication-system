import type { Express } from 'express';
import { CapturedMailer } from '../../@testing/integration/captured-mail.js';
import {
  createGraphQLApp,
  gql,
  login,
  loginAdmin,
} from '../../@testing/integration/graphql-client.js';
import { useIntegrationInfrastructure } from '../../@testing/integration/lifecycle.js';
import { createTenant, type Tenant } from '../../@testing/integration/tenant.js';

const CREATE_USER = /* GraphQL */ `
  mutation ($email: String!, $name: String!) {
    createUser(input: { name: $name, email: $email }) {
      id
      email
      active
    }
  }
`;
const SET_PASSWORD = /* GraphQL */ `
  mutation ($token: String!, $newPassword: String!) {
    setPassword(token: $token, newPassword: $newPassword)
  }
`;
const REQUEST_RESET = /* GraphQL */ `
  mutation ($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

describe('GraphQL users, invitations and password flows (real PostgreSQL + Redis)', () => {
  let app: Express;
  let tenant: Tenant;
  let adminToken: string;

  useIntegrationInfrastructure();
  beforeAll(async () => {
    app = await createGraphQLApp();
  });
  beforeEach(async () => {
    tenant = await createTenant('Back Office');
    adminToken = (await loginAdmin(app, tenant)).accessToken;
  });

  const invite = async (email: string, name = 'Bob') => {
    const response = await gql(app, CREATE_USER, {
      variables: { email, name },
      token: adminToken,
    });
    expect(response.errors).toBeUndefined();
    return response.data?.createUser as { id: string; email: string; active: boolean };
  };

  describe('invitation', () => {
    it('creates an inactive user and emails a single-use invitation token', async () => {
      const user = await invite('bob@example.com');
      expect(user).toMatchObject({ email: 'bob@example.com', active: false });

      const mail = CapturedMailer.lastTo('bob@example.com', 'invitation');
      expect(mail?.token).toEqual(expect.any(String));

      const set = await gql(app, SET_PASSWORD, {
        variables: { token: mail!.token, newPassword: 'BobPassword1' },
      });
      expect(set.data?.setPassword).toBe(true);

      // the account is now active and can log in
      const session = await login(app, tenant, 'bob@example.com', 'BobPassword1');
      expect(session.errors).toBeUndefined();

      const reused = await gql(app, SET_PASSWORD, {
        variables: { token: mail!.token, newPassword: 'AnotherPass1' },
      });
      expect(reused.errors).toBeDefined();
    });

    it('rejects a weak password without consuming the token', async () => {
      await invite('bob@example.com');
      const mail = CapturedMailer.lastTo('bob@example.com', 'invitation')!;

      const weak = await gql(app, SET_PASSWORD, {
        variables: { token: mail.token, newPassword: 'weak' },
      });
      expect(weak.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');

      const strong = await gql(app, SET_PASSWORD, {
        variables: { token: mail.token, newPassword: 'StrongPass1' },
      });
      expect(strong.data?.setPassword).toBe(true);
    });

    it('rejects an unknown token', async () => {
      const response = await gql(app, SET_PASSWORD, {
        variables: { token: 'not-a-real-token', newPassword: 'StrongPass1' },
      });
      expect(response.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
    });

    it('rate limits setPassword attempts with invalid tokens by IP', async () => {
      for (let i = 0; i < 5; i += 1) {
        await gql(app, SET_PASSWORD, {
          variables: { token: `bad-${i}`, newPassword: 'StrongPass1' },
        });
      }
      const blocked = await gql(app, SET_PASSWORD, {
        variables: { token: 'bad-again', newPassword: 'StrongPass1' },
      });
      expect(blocked.errors?.[0]?.extensions?.code).toBe('TOO_MANY_REQUESTS');
    });

    it('rejects a duplicate email with CONFLICT', async () => {
      await invite('bob@example.com');
      const duplicate = await gql(app, CREATE_USER, {
        variables: { email: 'bob@example.com', name: 'Bob 2' },
        token: adminToken,
      });
      expect(duplicate.errors?.[0]?.extensions?.code).toBe('CONFLICT');
    });
  });

  describe('password reset', () => {
    const activeUser = async (email: string, password = 'OldPassword1') => {
      await invite(email);
      const mail = CapturedMailer.lastTo(email, 'invitation')!;
      await gql(app, SET_PASSWORD, { variables: { token: mail.token, newPassword: password } });
    };

    it('emails a reset token, changes the password and ends every session', async () => {
      await activeUser('bob@example.com');
      const session = (await login(app, tenant, 'bob@example.com', 'OldPassword1')).data?.login;

      const requested = await gql(app, REQUEST_RESET, { variables: { email: 'bob@example.com' } });
      expect(requested.data?.requestPasswordReset).toBe(true);
      const mail = CapturedMailer.lastTo('bob@example.com', 'password-reset')!;

      const reset = await gql(app, SET_PASSWORD, {
        variables: { token: mail.token, newPassword: 'NewPassword1' },
      });
      expect(reset.data?.setPassword).toBe(true);

      const old = await login(app, tenant, 'bob@example.com', 'OldPassword1');
      expect(old.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
      expect((await login(app, tenant, 'bob@example.com', 'NewPassword1')).errors).toBeUndefined();

      const refreshed = await gql(
        app,
        `mutation ($t: String!) { refreshToken(refreshToken: $t) { accessToken } }`,
        { variables: { t: session.refreshToken } },
      );
      expect(refreshed.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('answers true for unknown emails and sends nothing (no enumeration)', async () => {
      const response = await gql(app, REQUEST_RESET, { variables: { email: 'ghost@example.com' } });
      expect(response.data?.requestPasswordReset).toBe(true);
      expect(CapturedMailer.sent).toEqual([]);
    });

    it('rate limits reset requests per email', async () => {
      await activeUser('bob@example.com');
      for (let i = 0; i < 5; i += 1) {
        await gql(app, REQUEST_RESET, { variables: { email: 'bob@example.com' } });
      }
      const blocked = await gql(app, REQUEST_RESET, { variables: { email: 'bob@example.com' } });
      expect(blocked.errors?.[0]?.extensions?.code).toBe('TOO_MANY_REQUESTS');
    });
  });

  describe('user management', () => {
    it('activates, deactivates, renames, reads and deletes a user', async () => {
      const user = await invite('bob@example.com');

      const mail = CapturedMailer.lastTo('bob@example.com', 'invitation')!;
      await gql(app, SET_PASSWORD, {
        variables: { token: mail.token, newPassword: 'BobPassword1' },
      });

      for (const [field, expected] of [
        ['deactivateUser', false],
        ['activateUser', true],
      ] as const) {
        const response = await gql(app, `mutation ($id: ID!) { ${field}(id: $id) { active } }`, {
          variables: { id: user.id },
          token: adminToken,
        });
        expect(response.data?.[field].active).toBe(expected);
      }

      const renamed = await gql(
        app,
        `mutation ($id: ID!) { updateUser(id: $id, name: "Robert") { name } }`,
        { variables: { id: user.id }, token: adminToken },
      );
      expect(renamed.data?.updateUser.name).toBe('Robert');

      const read = await gql(app, `query ($id: ID!) { user(id: $id) { email name } }`, {
        variables: { id: user.id },
        token: adminToken,
      });
      expect(read.data?.user).toEqual({ email: 'bob@example.com', name: 'Robert' });

      const deleted = await gql(app, `mutation ($id: ID!) { deleteUser(id: $id) }`, {
        variables: { id: user.id },
        token: adminToken,
      });
      expect(deleted.data?.deleteUser).toBe(true);

      const gone = await gql(app, `query ($id: ID!) { user(id: $id) { id } }`, {
        variables: { id: user.id },
        token: adminToken,
      });
      expect(gone.data?.user).toBeNull();
    });

    it('lists the users of the current tenant with pagination info', async () => {
      const response = await gql(
        app,
        `{ users(page: 1, limit: 5) { items { email } pageInfo { total page limit totalPages } } }`,
        { token: adminToken },
      );
      expect(response.errors).toBeUndefined();
      expect(response.data?.users.items).toEqual([{ email: tenant.admin.email }]);
      expect(response.data?.users.pageInfo).toEqual({
        total: 1,
        page: 1,
        limit: 5,
        totalPages: 1,
      });
    });

    it('assigns and removes roles, returning the user with its roles', async () => {
      const user = await invite('bob@example.com');

      const assigned = await gql(
        app,
        `mutation ($userId: ID!, $roleIds: [ID!]!, $app: ID!) {
          assignRolesToUser(userId: $userId, roleIds: $roleIds, clientApplicationId: $app) {
            roles { id name permissions { name } }
          }
        }`,
        {
          variables: { userId: user.id, roleIds: [tenant.roleId], app: tenant.clientApplicationId },
          token: adminToken,
        },
      );
      expect(assigned.errors).toBeUndefined();
      expect(assigned.data?.assignRolesToUser.roles).toHaveLength(1);
      expect(assigned.data?.assignRolesToUser.roles[0].permissions).toHaveLength(17);

      const removed = await gql(
        app,
        `mutation ($userId: ID!, $roleIds: [ID!]!, $app: ID!) {
          removeRolesFromUser(userId: $userId, roleIds: $roleIds, clientApplicationId: $app) {
            roles { id }
          }
        }`,
        {
          variables: { userId: user.id, roleIds: [tenant.roleId], app: tenant.clientApplicationId },
          token: adminToken,
        },
      );
      expect(removed.data?.removeRolesFromUser.roles).toEqual([]);
    });
  });
});
