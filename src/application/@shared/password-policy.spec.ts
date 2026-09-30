import { assertStrongPassword } from './password-policy.js';

describe('assertStrongPassword', () => {
  it('accepts a password that satisfies every rule', () => {
    expect(() => assertStrongPassword('Secret123')).not.toThrow();
  });

  it.each([
    ['Ab1', 'Password must be at least 8 characters long'],
    ['A1' + 'a'.repeat(127), 'Password must be at most 128 characters long'],
    ['SECRET123', 'Password must contain at least one lowercase letter'],
    ['secret123', 'Password must contain at least one uppercase letter'],
    ['SecretSecret', 'Password must contain at least one digit'],
  ])('rejects "%s" with a descriptive message', (password, message) => {
    expect(() => assertStrongPassword(password)).toThrow(message);
  });

  it('accepts the exact length boundaries', () => {
    expect(() => assertStrongPassword('Abcdef1g')).not.toThrow();
    expect(() => assertStrongPassword('A1' + 'a'.repeat(126))).not.toThrow();
  });
});
