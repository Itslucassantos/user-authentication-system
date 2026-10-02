import { randomUUID } from 'node:crypto';
import { generateOpaqueToken } from '../../application/@shared/opaque-token.js';
import ClientApplicationFactory from '../../domain/client-application/factory/client-application.factory.js';
import PermissionFactory from '../../domain/role/factory/permission.factory.js';
import RoleFactory from '../../domain/role/factory/role.factory.js';
import UserFactory from '../../domain/user/factory/user.factory.js';
import Email from '../../domain/user/value-object/email.js';
import BcryptHasher from '../../infrastructure/auth/hasher/bcrypt-hasher.js';
import { repositories } from '../../container/index.js';

export const ALL_PERMISSIONS: ReadonlyArray<[resource: string, action: string]> = [
  ['user', 'create'],
  ['user', 'read'],
  ['user', 'update'],
  ['user', 'delete'],
  ['role', 'create'],
  ['role', 'read'],
  ['role', 'update'],
  ['role', 'delete'],
  ['role', 'assign'],
  ['permission', 'create'],
  ['permission', 'read'],
  ['permission', 'update'],
  ['permission', 'delete'],
  ['client-application', 'create'],
  ['client-application', 'read'],
  ['client-application', 'update'],
  ['client-application', 'delete'],
];

export const ADMIN_PASSWORD = 'AdminPass123';

const hasher = new BcryptHasher();

export interface Tenant {
  clientApplicationId: string;
  clientId: string;
  clientSecret: string;
  admin: { id: string; email: string; password: string };
  roleId: string;
}

/**
 * Creates a client application (tenant) with an admin role holding `permissions` (all of them by
 * default) and an active admin user. Written through the real repositories, like the admin seed.
 */
export async function createTenant(
  name: string,
  options: { adminEmail?: string; permissions?: typeof ALL_PERMISSIONS } = {},
): Promise<Tenant> {
  const clientSecret = generateOpaqueToken();
  const clientApplication = ClientApplicationFactory.create(
    name,
    randomUUID(),
    await hasher.hash(clientSecret),
    [`https://${name.toLowerCase().replace(/\W+/g, '-')}.example.com/callback`],
  );
  await repositories.clientApplication.save(clientApplication);

  const permissions = [];
  for (const [resource, action] of options.permissions ?? ALL_PERMISSIONS) {
    const permission = PermissionFactory.create(
      clientApplication.id,
      `${resource}:${action}`,
      resource,
      action,
      `Allows "${action}" on "${resource}"`,
    );
    await repositories.permission.save(permission);
    permissions.push(permission);
  }

  const role = RoleFactory.create(clientApplication.id, 'admin', 'Administrator', permissions);
  await repositories.role.save(role);

  const adminEmail = options.adminEmail ?? `admin@${clientApplication.clientId}.example.com`;
  const user = UserFactory.create('Admin', new Email(adminEmail));
  user.setPasswordHash(await hasher.hash(ADMIN_PASSWORD));
  user.activate();
  await repositories.user.save(user);
  user.setRoles([role]);
  await repositories.user.update(user);

  return {
    clientApplicationId: clientApplication.id,
    clientId: clientApplication.clientId,
    clientSecret,
    admin: { id: user.id, email: adminEmail, password: ADMIN_PASSWORD },
    roleId: role.id,
  };
}
