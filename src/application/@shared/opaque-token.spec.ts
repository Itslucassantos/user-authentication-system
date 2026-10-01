import { generateOpaqueToken, sha256 } from './opaque-token.js';

describe('generateOpaqueToken', () => {
  it('returns 32 random bytes encoded as 64 hex characters', () => {
    expect(generateOpaqueToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never repeats', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateOpaqueToken()));

    expect(tokens.size).toBe(50);
  });
});

describe('sha256', () => {
  it('matches the known digest', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('is deterministic and never returns the input', () => {
    expect(sha256('token')).toBe(sha256('token'));
    expect(sha256('token')).not.toBe('token');
  });
});
