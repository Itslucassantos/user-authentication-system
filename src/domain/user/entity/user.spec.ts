import {
  CLIENT_APPLICATION_ID,
  OTHER_CLIENT_APPLICATION_ID,
  makePermission,
  makeRole,
} from '../../../@testing/builders.js';
import Email from '../value-object/email.js';
import User from './user.js';

const makeNewUser = () => new User('user-1', 'John Doe', new Email('john.doe@example.com'));

describe('User', () => {
  describe('creation', () => {
    it('starts inactive, without password and without roles', () => {
      const user = makeNewUser();

      expect(user.active).toBe(false);
      expect(user.passwordHash).toBeNull();
      expect(user.roles).toEqual([]);
    });

    it.each([
      ['ID', () => new User('', 'John', new Email('john@example.com'))],
      ['Name', () => new User('user-1', '', new Email('john@example.com'))],
      ['Email', () => new User('user-1', 'John', undefined as unknown as Email)],
    ])('requires the %s', (field, build) => {
      expect(build).toThrow(`${field} is required`);
    });
  });

  describe('activate', () => {
    it('refuses to activate a user that has no password yet', () => {
      const user = makeNewUser();

      expect(() => user.activate()).toThrow('Password must be set before activating the user');
      expect(user.active).toBe(false);
    });

    it('activates a user once the password is set', () => {
      const user = makeNewUser();
      user.setPasswordHash('hash');

      user.activate();

      expect(user.active).toBe(true);
    });
  });

  it('deactivates an active user', () => {
    const user = makeNewUser();
    user.setPasswordHash('hash');
    user.activate();

    user.deactivate();

    expect(user.active).toBe(false);
  });

  describe('changeName', () => {
    it('changes the name', () => {
      const user = makeNewUser();

      user.changeName('Jane Doe');

      expect(user.name).toBe('Jane Doe');
    });

    it('rejects an empty name', () => {
      expect(() => makeNewUser().changeName('')).toThrow('Name is required');
    });
  });

  describe('roles', () => {
    it('returns a defensive copy, so callers cannot mutate the aggregate', () => {
      const user = makeNewUser();
      user.setRoles([makeRole()]);

      user.roles.pop();

      expect(user.roles).toHaveLength(1);
    });

    it('rolesFor only returns the roles of the given client application', () => {
      const ownRole = makeRole({ name: 'own' });
      const foreignRole = makeRole({
        name: 'foreign',
        clientApplicationId: OTHER_CLIENT_APPLICATION_ID,
      });
      const user = makeNewUser();
      user.setRoles([ownRole, foreignRole]);

      expect(user.rolesFor(CLIENT_APPLICATION_ID)).toEqual([ownRole]);
    });

    it('treats a nullish role list as empty', () => {
      const user = makeNewUser();
      user.setRoles([makeRole()]);

      user.setRoles(undefined as never);

      expect(user.roles).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    const role = makeRole({
      permissions: [makePermission({ resource: 'users', action: 'read' })],
    });
    const user = makeNewUser();
    user.setRoles([role]);

    it('is true when a role of the client application grants the permission', () => {
      expect(user.hasPermission('users', 'read', CLIENT_APPLICATION_ID)).toBe(true);
    });

    it('is false when no role grants the permission', () => {
      expect(user.hasPermission('users', 'delete', CLIENT_APPLICATION_ID)).toBe(false);
    });

    it('does not leak permissions across client applications (multi-tenant isolation)', () => {
      expect(user.hasPermission('users', 'read', OTHER_CLIENT_APPLICATION_ID)).toBe(false);
    });
  });
});
