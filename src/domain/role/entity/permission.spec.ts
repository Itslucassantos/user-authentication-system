import Permission from './permission.js';

const makeNewPermission = (description?: string) =>
  new Permission('perm-1', 'app-1', 'Read users', 'users', 'read', description);

describe('Permission', () => {
  it('keeps the data it was created with', () => {
    const permission = makeNewPermission('Allows reading users');

    expect(permission).toMatchObject({
      id: 'perm-1',
      clientApplicationId: 'app-1',
      name: 'Read users',
      resource: 'users',
      action: 'read',
      description: 'Allows reading users',
    });
  });

  it('defaults the description to an empty string', () => {
    expect(makeNewPermission().description).toBe('');
  });

  it.each([
    ['Permission ID', () => new Permission('', 'app-1', 'n', 'r', 'a')],
    ['Application ID', () => new Permission('id', '', 'n', 'r', 'a')],
    ['Permission name', () => new Permission('id', 'app-1', '', 'r', 'a')],
    ['Permission resource', () => new Permission('id', 'app-1', 'n', '', 'a')],
    ['Permission action', () => new Permission('id', 'app-1', 'n', 'r', '')],
  ])('requires the %s', (field, build) => {
    expect(build).toThrow(`${field} is required`);
  });

  it('changes and clears the description', () => {
    const permission = makeNewPermission('old');

    permission.changeDescription('new');
    expect(permission.description).toBe('new');

    permission.changeDescription(undefined);
    expect(permission.description).toBe('');
  });

  describe('matches', () => {
    const permission = makeNewPermission();

    it('matches the exact resource and action', () => {
      expect(permission.matches('users', 'read')).toBe(true);
    });

    it.each([
      ['users', 'write'],
      ['roles', 'read'],
    ])('does not match %s:%s', (resource, action) => {
      expect(permission.matches(resource, action)).toBe(false);
    });
  });
});
