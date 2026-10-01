import { makeRole } from '../../../@testing/builders.js';
import Email from '../value-object/email.js';
import UserFactory from './user.factory.js';

describe('UserFactory', () => {
  const email = new Email('john.doe@example.com');

  describe('create', () => {
    it('builds a new inactive user with a generated id', () => {
      const user = UserFactory.create('John Doe', email);

      expect(user.id).toEqual(expect.any(String));
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe(email);
      expect(user.active).toBe(false);
    });

    it('generates a distinct id for each user', () => {
      expect(UserFactory.create('A', email).id).not.toBe(UserFactory.create('A', email).id);
    });
  });

  describe('restore', () => {
    it('rebuilds the persisted state', () => {
      const role = makeRole();

      const user = UserFactory.restore({
        id: 'user-1',
        name: 'John Doe',
        email,
        passwordHash: 'hash',
        active: true,
        roles: [role],
      });

      expect(user).toMatchObject({
        id: 'user-1',
        name: 'John Doe',
        passwordHash: 'hash',
        active: true,
      });
      expect(user.roles).toEqual([role]);
    });

    it('restores an invited user that has not set a password yet', () => {
      const user = UserFactory.restore({
        id: 'user-1',
        name: 'John Doe',
        email,
        passwordHash: null,
        active: false,
        roles: [],
      });

      expect(user.passwordHash).toBeNull();
      expect(user.active).toBe(false);
    });
  });
});
