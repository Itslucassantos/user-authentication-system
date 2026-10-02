import { randomUUID } from 'node:crypto';
import { makeClientApplication, makePermission, makeRole } from '../../../../@testing/builders.js';
import { useIntegrationInfrastructure } from '../../../../@testing/integration/lifecycle.js';
import PermissionAlreadyExistsError from '../../../../domain/role/error/permission-already-exists-error.js';
import PermissionInUseError from '../../../../domain/role/error/permission-in-use-error.js';
import PermissionNotFoundError from '../../../../domain/role/error/permission-not-found-error.js';
import RoleAlreadyExistsError from '../../../../domain/role/error/role-already-exists-error.js';
import RoleNotFoundError from '../../../../domain/role/error/role-not-found-error.js';
import ClientApplicationRepository from '../../../client-application/repository/sequelize/client-application.repository.js';
import PermissionRepository from './permission.repository.js';
import RoleRepository from './role.repository.js';

describe('Role and Permission repositories (PostgreSQL)', () => {
  useIntegrationInfrastructure();
  const clientApplications = new ClientApplicationRepository();
  const permissions = new PermissionRepository();
  const roles = new RoleRepository();

  const tenantA = randomUUID();
  const tenantB = randomUUID();

  async function createTenants() {
    await clientApplications.save(
      makeClientApplication({ id: tenantA, name: 'A', clientId: 'client-a' }),
    );
    await clientApplications.save(
      makeClientApplication({ id: tenantB, name: 'B', clientId: 'client-b' }),
    );
  }

  beforeEach(createTenants);

  /** A role must hold at least one permission, so each one gets its own persisted permission. */
  async function buildRole(clientApplicationId: string, name = 'admin') {
    const permission = makePermission({ clientApplicationId, action: randomUUID() });
    await permissions.save(permission);
    return makeRole({ clientApplicationId, name, permissions: [permission] });
  }

  describe('permissions', () => {
    it('saves, finds and updates a permission', async () => {
      const permission = makePermission({ clientApplicationId: tenantA });
      await permissions.save(permission);

      expect(await permissions.findById(permission.id)).toMatchObject({
        resource: 'users',
        action: 'read',
        clientApplicationId: tenantA,
      });

      permission.changeDescription('New description');
      await permissions.update(permission);
      expect((await permissions.findById(permission.id))?.description).toBe('New description');
    });

    it('enforces unique resource+action per client application, not globally', async () => {
      await permissions.save(makePermission({ clientApplicationId: tenantA }));

      await expect(
        permissions.save(makePermission({ clientApplicationId: tenantA, name: 'Other' })),
      ).rejects.toBeInstanceOf(PermissionAlreadyExistsError);
      await expect(
        permissions.save(makePermission({ clientApplicationId: tenantB })),
      ).resolves.toBeUndefined();
    });

    it('scopes findByIds, findByResourceAndAction and listing to the client application', async () => {
      const a = makePermission({ clientApplicationId: tenantA });
      const b = makePermission({ clientApplicationId: tenantB });
      await permissions.save(a);
      await permissions.save(b);

      expect(await permissions.findByIds(tenantA, [a.id, b.id])).toHaveLength(1);
      expect((await permissions.findByResourceAndAction(tenantB, 'users', 'read'))?.id).toBe(b.id);
      expect(await permissions.findByResourceAndAction(tenantA, 'users', 'write')).toBeNull();

      const listed = await permissions.findAllByClientApplication(tenantA, { page: 1, limit: 10 });
      expect(listed.items.map((p) => p.id)).toEqual([a.id]);
    });

    it('throws PermissionNotFoundError for missing records', async () => {
      const missing = makePermission({ clientApplicationId: tenantA });
      await expect(permissions.update(missing)).rejects.toBeInstanceOf(PermissionNotFoundError);
      await expect(permissions.delete(missing.id)).rejects.toBeInstanceOf(PermissionNotFoundError);
    });

    it('refuses to delete a permission that a role uses (FK RESTRICT)', async () => {
      const permission = makePermission({ clientApplicationId: tenantA });
      await permissions.save(permission);
      await roles.save(makeRole({ clientApplicationId: tenantA, permissions: [permission] }));

      expect(await permissions.isInUse(permission.id)).toBe(true);
      await expect(permissions.delete(permission.id)).rejects.toBeInstanceOf(PermissionInUseError);
    });

    it('deletes an unused permission', async () => {
      const permission = makePermission({ clientApplicationId: tenantA });
      await permissions.save(permission);

      expect(await permissions.isInUse(permission.id)).toBe(false);
      await permissions.delete(permission.id);
      expect(await permissions.findById(permission.id)).toBeNull();
    });
  });

  describe('roles', () => {
    it('saves a role together with its permissions and loads them back', async () => {
      const read = makePermission({ clientApplicationId: tenantA, action: 'read' });
      const write = makePermission({ clientApplicationId: tenantA, action: 'write' });
      await permissions.save(read);
      await permissions.save(write);

      const role = makeRole({ clientApplicationId: tenantA, permissions: [read, write] });
      await roles.save(role);

      const found = await roles.findById(role.id);
      expect(found?.permissions.map((p) => p.id).sort()).toEqual([read.id, write.id].sort());
      expect((await roles.findByName(tenantA, 'admin'))?.id).toBe(role.id);
      expect(await roles.findByName(tenantB, 'admin')).toBeNull();
    });

    it('enforces unique role name per client application, not globally', async () => {
      await roles.save(await buildRole(tenantA));

      await expect(roles.save(await buildRole(tenantA))).rejects.toBeInstanceOf(
        RoleAlreadyExistsError,
      );
      await expect(roles.save(await buildRole(tenantB))).resolves.toBeUndefined();
    });

    it('replaces the permissions of a role on update', async () => {
      const read = makePermission({ clientApplicationId: tenantA, action: 'read' });
      const write = makePermission({ clientApplicationId: tenantA, action: 'write' });
      await permissions.save(read);
      await permissions.save(write);
      const role = makeRole({ clientApplicationId: tenantA, permissions: [read] });
      await roles.save(role);

      role.changePermissions([write]);
      role.changeName('editor');
      await roles.update(role);

      const found = await roles.findById(role.id);
      expect(found?.name).toBe('editor');
      expect(found?.permissions.map((p) => p.id)).toEqual([write.id]);
    });

    it('lists roles per client application with pagination and supports findByIds', async () => {
      const a1 = await buildRole(tenantA, 'r1');
      const a2 = await buildRole(tenantA, 'r2');
      const b1 = await buildRole(tenantB, 'r1');
      for (const role of [a1, a2, b1]) await roles.save(role);

      const page = await roles.findAllByClientApplication(tenantA, { page: 1, limit: 1 });
      expect(page).toMatchObject({ total: 2, totalPages: 2 });
      expect(page.items).toHaveLength(1);

      expect((await roles.findByIds([a1.id, b1.id])).map((r) => r.id).sort()).toEqual(
        [a1.id, b1.id].sort(),
      );
      expect((await roles.findAll({ page: 1, limit: 10 })).total).toBe(3);
    });

    it('throws RoleNotFoundError for missing records and deletes existing ones', async () => {
      const missing = await buildRole(tenantA);
      await expect(roles.update(missing)).rejects.toBeInstanceOf(RoleNotFoundError);
      await expect(roles.delete(missing.id)).rejects.toBeInstanceOf(RoleNotFoundError);

      await roles.save(missing);
      await roles.delete(missing.id);
      expect(await roles.findById(missing.id)).toBeNull();
    });
  });
});
