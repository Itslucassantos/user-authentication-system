import RefreshToken from './refresh-token.js';

const NOW = new Date('2026-01-01T12:00:00Z');
const inOneHour = new Date(NOW.getTime() + 60 * 60 * 1000);
const oneHourAgo = new Date(NOW.getTime() - 60 * 60 * 1000);

const makeNewToken = (expiresAt = inOneHour) =>
  new RefreshToken('token-1', 'user-1', 'app-1', 'hash', 'Firefox', expiresAt);

describe('RefreshToken', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts not revoked', () => {
    expect(makeNewToken()).toMatchObject({
      id: 'token-1',
      userId: 'user-1',
      clientApplicationId: 'app-1',
      tokenHash: 'hash',
      deviceInfo: 'Firefox',
      revoked: false,
    });
  });

  it.each([
    ['ID', () => new RefreshToken('', 'u', 'a', 'h', 'd', inOneHour)],
    ['User ID', () => new RefreshToken('i', '', 'a', 'h', 'd', inOneHour)],
    ['Client Application ID', () => new RefreshToken('i', 'u', '', 'h', 'd', inOneHour)],
    ['Token hash', () => new RefreshToken('i', 'u', 'a', '', 'd', inOneHour)],
    ['Device info', () => new RefreshToken('i', 'u', 'a', 'h', '', inOneHour)],
    ['Expiration date', () => new RefreshToken('i', 'u', 'a', 'h', 'd', undefined as never)],
  ])('requires the %s', (field, build) => {
    expect(build).toThrow(`${field} is required`);
  });

  describe('validity', () => {
    it('is valid while not revoked and not expired', () => {
      expect(makeNewToken().isValid()).toBe(true);
    });

    it('is invalid once revoked', () => {
      const token = makeNewToken();

      token.revoke();

      expect(token.revoked).toBe(true);
      expect(token.isValid()).toBe(false);
    });

    it('is invalid once expired', () => {
      const token = makeNewToken(oneHourAgo);

      expect(token.isExpired()).toBe(true);
      expect(token.isValid()).toBe(false);
    });

    it('expires exactly at the expiration instant', () => {
      expect(makeNewToken(NOW).isExpired()).toBe(true);
    });
  });
});
