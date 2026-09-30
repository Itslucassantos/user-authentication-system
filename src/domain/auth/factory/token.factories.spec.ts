import { PasswordTokenType } from '../enum/password-token-type.enum.js';
import PasswordTokenFactory from './password-token.factory.js';
import RefreshTokenFactory from './refresh-token.factory.js';

const NOW = new Date('2026-01-01T12:00:00Z');
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

describe('token factories', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('PasswordTokenFactory', () => {
    it('createInvitation expires in 7 days', () => {
      const token = PasswordTokenFactory.createInvitation('user-1', 'hash');

      expect(token.type).toBe(PasswordTokenType.INVITATION);
      expect(token.expiresAt.getTime()).toBe(NOW.getTime() + 7 * DAY_MS);
      expect(token.used).toBe(false);
    });

    it('createPasswordReset expires in 1 hour', () => {
      const token = PasswordTokenFactory.createPasswordReset('user-1', 'hash');

      expect(token.type).toBe(PasswordTokenType.PASSWORD_RESET);
      expect(token.expiresAt.getTime()).toBe(NOW.getTime() + HOUR_MS);
    });

    it('restore brings back a used token', () => {
      const expiresAt = new Date(NOW.getTime() + HOUR_MS);

      const token = PasswordTokenFactory.restore(
        'token-1',
        'user-1',
        PasswordTokenType.INVITATION,
        'hash',
        expiresAt,
        true,
      );

      expect(token).toMatchObject({ id: 'token-1', used: true });
      expect(token.isValid()).toBe(false);
    });

    it('restore brings back an unused token', () => {
      const token = PasswordTokenFactory.restore(
        'token-1',
        'user-1',
        PasswordTokenType.INVITATION,
        'hash',
        new Date(NOW.getTime() + HOUR_MS),
        false,
      );

      expect(token.isValid()).toBe(true);
    });
  });

  describe('RefreshTokenFactory', () => {
    it('create expires in 30 days', () => {
      const token = RefreshTokenFactory.create('user-1', 'app-1', 'hash', 'Firefox');

      expect(token.expiresAt.getTime()).toBe(NOW.getTime() + 30 * DAY_MS);
      expect(token.revoked).toBe(false);
    });

    it('restore brings back a revoked token', () => {
      const token = RefreshTokenFactory.restore(
        'token-1',
        'user-1',
        'app-1',
        'hash',
        'Firefox',
        new Date(NOW.getTime() + HOUR_MS),
        true,
      );

      expect(token).toMatchObject({ id: 'token-1', revoked: true });
      expect(token.isValid()).toBe(false);
    });
  });
});
