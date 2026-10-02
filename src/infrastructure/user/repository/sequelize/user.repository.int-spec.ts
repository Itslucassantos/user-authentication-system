import { makeUser } from '../../../../@testing/builders.js';
import { useIntegrationInfrastructure } from '../../../../@testing/integration/lifecycle.js';
import { createTenant } from '../../../../@testing/integration/tenant.js';
import UserAlreadyExistsError from '../../../../domain/user/error/user-already-exists-error.js';
import UserNotFoundError from '../../../../domain/user/error/user-not-found-error.js';
import Email from '../../../../domain/user/value-object/email.js';
import RoleRepository from '../../../role/repository/sequelize/role.repository.js';
import UserRepository from './user.repository.js';

describe('UserRepository (PostgreSQL)', () => {
  useIntegrationInfrastructure();
  const users = new UserRepository();
  const roles = new RoleRepository();

  it('saves and finds a user by id and by email', async () => {
    const user = makeUser({ email: 'ana@example.com', name: 'Ana', active: false });
    await users.save(user);

    const byId = await users.findById(user.id);
    expect(byId).toMatchObject({ id: user.id, name: 'Ana', active: false, roles: [] });
    expect(byId?.email.value).toBe('ana@example.com');
    expect((await users.findByEmail(new Email('ana@example.com')))?.id).toBe(user.id);
  });

  it('returns null for unknown ids and emails', async () => {
    expect(await users.findById('00000000-0000-0000-0000-000000000000')).toBeNull();
    expect(await users.findByEmail(new Email('nobody@example.com'))).toBeNull();
  });

  it('persists a user without a password hash (invited, not yet activated)', async () => {
    const user = makeUser({ passwordHash: null, active: false });
    await users.save(user);
    expect((await users.findById(user.id))?.passwordHash).toBeNull();
  });

  it('rejects a duplicate email with UserAlreadyExistsError', async () => {
    await users.save(makeUser({ email: 'dup@example.com' }));
    await expect(users.save(makeUser({ email: 'dup@example.com' }))).rejects.toBeInstanceOf(
      UserAlreadyExistsError,
    );
  });

  it('updates name, active flag and password hash', async () => {
    const user = makeUser({ active: false, passwordHash: null });
    await users.save(user);

    user.changeName('Renamed');
    user.setPasswordHash('new-hash');
    user.activate();
    await users.update(user);

    expect(await users.findById(user.id)).toMatchObject({
      name: 'Renamed',
      passwordHash: 'new-hash',
      active: true,
    });
  });

  it('throws UserNotFoundError when updating or deleting a missing user', async () => {
    await expect(users.update(makeUser())).rejects.toBeInstanceOf(UserNotFoundError);
    await expect(users.delete('00000000-0000-0000-0000-000000000000')).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it('deletes a user', async () => {
    const user = makeUser();
    await users.save(user);
    await users.delete(user.id);
    expect(await users.findById(user.id)).toBeNull();
  });

  it('replaces the user roles on update and loads roles with their permissions', async () => {
    const tenant = await createTenant('Back Office');
    const [adminRole] = await roles.findByIds([tenant.roleId]);
    const user = makeUser({ email: 'roles@example.com' });
    await users.save(user);

    user.setRoles([adminRole!]);
    await users.update(user);

    const loaded = await users.findById(user.id);
    expect(loaded?.roles).toHaveLength(1);
    expect(loaded?.roles[0]?.permissions).toHaveLength(17);

    loaded!.setRoles([]);
    await users.update(loaded!);
    expect((await users.findById(user.id))?.roles).toEqual([]);
  });

  it('paginates users newest first, with the right totals', async () => {
    for (let i = 1; i <= 5; i += 1) {
      await users.save(makeUser({ email: `user${i}@example.com`, name: `User ${i}` }));
    }

    const page = await users.findAll({ page: 2, limit: 2 });
    expect(page).toMatchObject({ total: 5, page: 2, limit: 2, totalPages: 3 });
    expect(page.items).toHaveLength(2);
  });

  it('lists only the users that hold a role in the given client application', async () => {
    const tenantA = await createTenant('Tenant A', { adminEmail: 'a@example.com' });
    const tenantB = await createTenant('Tenant B', { adminEmail: 'b@example.com' });
    await users.save(makeUser({ email: 'no-role@example.com' }));

    const a = await users.findAllByClientApplication(tenantA.clientApplicationId, {
      page: 1,
      limit: 10,
    });
    expect(a.total).toBe(1);
    expect(a.items.map((user) => user.id)).toEqual([tenantA.admin.id]);

    const b = await users.findAllByClientApplication(tenantB.clientApplicationId, {
      page: 1,
      limit: 10,
    });
    expect(b.items.map((user) => user.id)).toEqual([tenantB.admin.id]);
  });

  it('findByIds returns only the requested users and handles an empty list', async () => {
    const first = makeUser({ email: 'one@example.com' });
    const second = makeUser({ email: 'two@example.com' });
    await users.save(first);
    await users.save(second);

    expect(await users.findByIds([])).toEqual([]);
    const found = await users.findByIds([first.id]);
    expect(found.map((user) => user.id)).toEqual([first.id]);
  });
});
