import BcryptHasher from './bcrypt-hasher.js';

describe('BcryptHasher', () => {
  const hasher = new BcryptHasher();

  it('produces a bcrypt hash that is not the plain value', async () => {
    const hash = await hasher.hash('Secret123');

    expect(hash).toMatch(/^\$2[aby]\$10\$/);
    expect(hash).not.toContain('Secret123');
  });

  it('salts every hash, so equal inputs never produce equal hashes', async () => {
    const [first, second] = await Promise.all([hasher.hash('Secret123'), hasher.hash('Secret123')]);

    expect(first).not.toBe(second);
  });

  it('accepts the original value and rejects any other', async () => {
    const hash = await hasher.hash('Secret123');

    expect(await hasher.compare('Secret123', hash)).toBe(true);
    expect(await hasher.compare('secret123', hash)).toBe(false);
  });
});
