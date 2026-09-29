import { v4 as uuid } from 'uuid';
import ClientApplicationFactory from '../../domain/client-application/factory/client-application.factory.js';
import PermissionFactory from '../../domain/role/factory/permission.factory.js';
import RoleFactory from '../../domain/role/factory/role.factory.js';
import UserFactory from '../../domain/user/factory/user.factory.js';
import Email from '../../domain/user/value-object/email.js';
import { generateOpaqueToken } from '../../application/@shared/opaque-token.js';
import BcryptHasher from '../auth/hasher/bcrypt-hasher.js';
import ClientApplicationRepository from '../client-application/repository/sequelize/client-application.repository.js';
import PermissionRepository from '../role/repository/sequelize/permission.repository.js';
import RoleRepository from '../role/repository/sequelize/role.repository.js';
import UserRepository from '../user/repository/sequelize/user.repository.js';
import { sequelize } from './sequelize.js';

try {
  process.loadEnvFile();
} catch {
  console.warn('.env file not found, using process.env');
}

const PERMISSIONS: ReadonlyArray<{ resource: string; action: string }> = [
  { resource: 'user', action: 'create' },
  { resource: 'user', action: 'read' },
  { resource: 'user', action: 'update' },
  { resource: 'user', action: 'delete' },
  { resource: 'role', action: 'create' },
  { resource: 'role', action: 'read' },
  { resource: 'role', action: 'update' },
  { resource: 'role', action: 'delete' },
  { resource: 'role', action: 'assign' },
  { resource: 'permission', action: 'create' },
  { resource: 'permission', action: 'read' },
  { resource: 'permission', action: 'update' },
  { resource: 'permission', action: 'delete' },
  { resource: 'client-application', action: 'create' },
  { resource: 'client-application', action: 'read' },
  { resource: 'client-application', action: 'update' },
  { resource: 'client-application', action: 'delete' },
];

const adminEmail = process.env.ADMIN_EMAIL;
if (!adminEmail) {
  console.error(
    'Missing ADMIN_EMAIL environment variable. Usage: ADMIN_EMAIL=admin@example.com npm run seed:admin',
  );
  process.exit(1);
}

const adminName = process.env.ADMIN_NAME ?? 'Administrator';
const appName = process.env.ADMIN_APP_NAME ?? 'Admin Console';
const appRedirectUri = process.env.ADMIN_APP_REDIRECT_URI ?? 'http://localhost:3000/callback';
const roleName = process.env.ADMIN_ROLE_NAME ?? 'admin';

const hasher = new BcryptHasher();
const clientApplicationRepository = new ClientApplicationRepository();
const permissionRepository = new PermissionRepository();
const roleRepository = new RoleRepository();
const userRepository = new UserRepository();

async function ensureClientApplication(): Promise<{ id: string; isNew: boolean }> {
  const existing = await clientApplicationRepository.findByName(appName);
  if (existing) {
    console.log(
      `Client application "${appName}" already exists (id: ${existing.id}) — reusing it.`,
    );
    return { id: existing.id, isNew: false };
  }

  const clientSecret = generateOpaqueToken();
  const clientApplication = ClientApplicationFactory.create(
    appName,
    uuid(),
    await hasher.hash(clientSecret),
    [appRedirectUri],
  );
  await clientApplicationRepository.save(clientApplication);

  console.log(`Created client application "${appName}":`);
  console.log(`  id:           ${clientApplication.id}`);
  console.log(`  clientId:     ${clientApplication.clientId}`);
  console.log(`  clientSecret: ${clientSecret}  (shown once — store it now)`);

  return { id: clientApplication.id, isNew: true };
}

async function ensurePermissions(clientApplicationId: string) {
  const permissions = [];
  for (const { resource, action } of PERMISSIONS) {
    const existing = await permissionRepository.findByResourceAndAction(
      clientApplicationId,
      resource,
      action,
    );
    if (existing) {
      permissions.push(existing);
      continue;
    }

    const permission = PermissionFactory.create(
      clientApplicationId,
      `${resource}:${action}`,
      resource,
      action,
      `Allows "${action}" on "${resource}"`,
    );
    await permissionRepository.save(permission);
    permissions.push(permission);
  }
  return permissions;
}

async function ensureAdminRole(
  clientApplicationId: string,
  permissions: Awaited<ReturnType<typeof ensurePermissions>>,
) {
  const existing = await roleRepository.findByName(clientApplicationId, roleName);
  if (existing) {
    existing.changePermissions(permissions);
    await roleRepository.update(existing);
    console.log(
      `Role "${roleName}" already existed — synced it with all ${permissions.length} permissions.`,
    );
    return existing;
  }

  const role = RoleFactory.create(
    clientApplicationId,
    roleName,
    'Full access — created by the admin bootstrap seed',
    permissions,
  );
  await roleRepository.save(role);
  console.log(`Created role "${roleName}" with all ${permissions.length} permissions.`);
  return role;
}

async function ensureAdminUser(adminRole: Awaited<ReturnType<typeof ensureAdminRole>>) {
  const email = new Email(adminEmail!);
  const existing = await userRepository.findByEmail(email);

  if (existing) {
    if (!existing.roles.some((role) => role.id === adminRole.id)) {
      existing.setRoles([...existing.roles, adminRole]);
      await userRepository.update(existing);
      console.log(`User "${adminEmail}" already existed — granted the "${roleName}" role.`);
    } else {
      console.log(
        `User "${adminEmail}" already existed and already has the "${roleName}" role — nothing to do.`,
      );
    }
    return;
  }

  const password = process.env.ADMIN_PASSWORD ?? generateOpaqueToken().slice(0, 24);
  const user = UserFactory.create(adminName, email);
  user.setPasswordHash(await hasher.hash(password));
  user.activate();
  await userRepository.save(user);

  user.setRoles([adminRole]);
  await userRepository.update(user);

  console.log(`Created admin user "${adminEmail}":`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`  password: ${password}  (generated, shown once — store it now)`);
  }
}

try {
  const { id: clientApplicationId } = await ensureClientApplication();
  const permissions = await ensurePermissions(clientApplicationId);
  const adminRole = await ensureAdminRole(clientApplicationId, permissions);
  await ensureAdminUser(adminRole);
  console.log('Admin seed finished.');
} finally {
  await sequelize.close();
}
