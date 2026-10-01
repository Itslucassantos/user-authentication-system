import { PasswordTokenType } from '../enum/password-token-type.enum.js';
import PasswordToken from './password-token.js';

const NOW = new Date('2026-01-01T12:00:00Z');
const inOneHour = new Date(NOW.getTime() + 60 * 60 * 1000);
const oneHourAgo = new Date(NOW.getTime() - 60 * 60 * 1000);

const makeNewToken = (expiresAt = inOneHour) =>
  new PasswordToken('token-1', 'user-1', PasswordTokenType.PASSWORD_RESET, 'hash', expiresAt);

describe('PasswordToken', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts unused', () => {
    expect(makeNewToken()).toMatchObject({
      id: 'token-1',
      userId: 'user-1',
      type: PasswordTokenType.PASSWORD_RESET,
      tokenHash: 'hash',
      used: false,
    });
  });

  it.each([
    ['ID', () => new PasswordToken('', 'u', PasswordTokenType.INVITATION, 'h', inOneHour)],
    ['User ID', () => new PasswordToken('i', '', PasswordTokenType.INVITATION, 'h', inOneHour)],
    ['Type', () => new PasswordToken('i', 'u', undefined as never, 'h', inOneHour)],
    ['Token hash', () => new PasswordToken('i', 'u', PasswordTokenType.INVITATION, '', inOneHour)],
    [
      'Expiration date',
      () => new PasswordToken('i', 'u', PasswordTokenType.INVITATION, 'h', undefined as never),
    ],
  ])('requires the %s', (field, build) => {
    expect(build).toThrow(`${field} is required`);
  });

  describe('isValid', () => {
    it('is valid while unused and not expired', () => {
      expect(makeNewToken().isValid()).toBe(true);
    });

    it('is invalid once used (single-use token)', () => {
      const token = makeNewToken();

      token.markUsed();

      expect(token.used).toBe(true);
      expect(token.isValid()).toBe(false);
    });

    it('is invalid once expired', () => {
      expect(makeNewToken(oneHourAgo).isValid()).toBe(false);
    });
  });
});
