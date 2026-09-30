import { CLIENT_APPLICATION_ID, makePermission } from '../../../@testing/builders.js';
import PermissionFactory from './permission.factory.js';
import RoleFactory from './role.factory.js';

describe('PermissionFactory', () => {
  it('create generates a distinct id per permission', () => {
    const a = PermissionFactory.create(CLIENT_APPLICATION_ID, 'Read', 'users', 'read');
    const b = PermissionFactory.create(CLIENT_APPLICATION_ID, 'Read', 'users', 'read');

    expect(a.id).not.toBe(b.id);
    expect(a.description).toBe('');
  });

  it('restore keeps the persisted id', () => {
    const permission = PermissionFactory.restore(
      'perm-1',
      CLIENT_APPLICATION_ID,
      'Read',
      'users',
      'read',
      'desc',
    );

    expect(permission).toMatchObject({ id: 'perm-1', description: 'desc' });
  });
});

describe('RoleFactory', () => {
  const permissions = [makePermission()];

  it('create generates a distinct id per role', () => {
    const a = RoleFactory.create(CLIENT_APPLICATION_ID, 'admin', 'Administrator', permissions);
    const b = RoleFactory.create(CLIENT_APPLICATION_ID, 'admin', 'Administrator', permissions);

    expect(a.id).not.toBe(b.id);
  });

  it('create enforces the role invariants', () => {
    expect(() => RoleFactory.create(CLIENT_APPLICATION_ID, 'admin', 'Administrator', [])).toThrow(
      'Role must have at least one permission',
    );
  });

  it('restore keeps the persisted id', () => {
    const role = RoleFactory.restore(
      'role-1',
      CLIENT_APPLICATION_ID,
      'admin',
      'Administrator',
      permissions,
    );

    expect(role.id).toBe('role-1');
    expect(role.permissions).toEqual(permissions);
  });
});
