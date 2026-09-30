import {
  CLIENT_APPLICATION_ID,
  OTHER_CLIENT_APPLICATION_ID,
  makePermission,
} from '../../../@testing/builders.js';
import Role from './role.js';

const makeNewRole = (permissions = [makePermission()]) =>
  new Role('role-1', CLIENT_APPLICATION_ID, 'admin', 'Administrator', permissions);

describe('Role', () => {
  describe('creation', () => {
    it('keeps the data it was created with', () => {
      const permission = makePermission();

      const role = makeNewRole([permission]);

      expect(role).toMatchObject({
        id: 'role-1',
        clientApplicationId: CLIENT_APPLICATION_ID,
        name: 'admin',
        description: 'Administrator',
      });
      expect(role.permissions).toEqual([permission]);
    });

    it.each([
      ['Role ID', () => new Role('', CLIENT_APPLICATION_ID, 'n', 'd', [makePermission()])],
      ['Application ID', () => new Role('id', '', 'n', 'd', [makePermission()])],
      ['Role name', () => new Role('id', CLIENT_APPLICATION_ID, '', 'd', [makePermission()])],
      [
        'Role description',
        () => new Role('id', CLIENT_APPLICATION_ID, 'n', '', [makePermission()]),
      ],
    ])('requires the %s', (field, build) => {
      expect(build).toThrow(`${field} is required`);
    });

    it('requires at least one permission', () => {
      expect(() => makeNewRole([])).toThrow('Role must have at least one permission');
    });

    it('rejects permissions from another client application', () => {
      const foreign = makePermission({ clientApplicationId: OTHER_CLIENT_APPLICATION_ID });

      expect(() => makeNewRole([foreign])).toThrow(
        'Role permissions must belong to the same client application as the role',
      );
    });
  });

  describe('changePermissions', () => {
    it('replaces the permissions', () => {
      const role = makeNewRole();
      const next = makePermission({ resource: 'roles', action: 'write' });

      role.changePermissions([next]);

      expect(role.permissions).toEqual([next]);
    });

    it('refuses an empty list and keeps the current permissions', () => {
      const role = makeNewRole();
      const before = role.permissions;

      expect(() => role.changePermissions([])).toThrow('Role must have at least one permission');
      expect(role.permissions).toEqual(before);
    });

    it('refuses permissions from another client application and keeps the current ones', () => {
      const role = makeNewRole();
      const before = role.permissions;
      const foreign = makePermission({ clientApplicationId: OTHER_CLIENT_APPLICATION_ID });

      expect(() => role.changePermissions([foreign])).toThrow(
        'Role permissions must belong to the same client application as the role',
      );
      expect(role.permissions).toEqual(before);
    });
  });

  describe('hasPermission', () => {
    const role = makeNewRole([makePermission({ resource: 'users', action: 'read' })]);

    it('is true for a granted resource and action', () => {
      expect(role.hasPermission('users', 'read')).toBe(true);
    });

    it.each([
      ['users', 'write'],
      ['roles', 'read'],
    ])('is false for %s:%s', (resource, action) => {
      expect(role.hasPermission(resource, action)).toBe(false);
    });
  });

  describe('changeName / changeDescription', () => {
    it('updates both fields', () => {
      const role = makeNewRole();

      role.changeName('editor');
      role.changeDescription('Editor');

      expect(role.name).toBe('editor');
      expect(role.description).toBe('Editor');
    });

    it('rejects empty values', () => {
      const role = makeNewRole();

      expect(() => role.changeName('')).toThrow('Role name is required');
      expect(() => role.changeDescription('')).toThrow('Role description is required');
    });
  });
});
