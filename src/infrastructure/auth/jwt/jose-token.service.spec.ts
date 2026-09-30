import { SignJWT } from 'jose';
import type { AccessTokenPayload } from '../../../application/@shared/token-service.interface.js';
import InvalidAccessTokenError from '../../../domain/auth/error/invalid-access-token-error.js';
import JoseTokenService from './jose-token.service.js';

const SECRET = 'a-secret-with-at-least-thirty-two-characters';
const payload: AccessTokenPayload = {
  sub: 'user-1',
  clientApplicationId: 'app-1',
  roles: ['admin'],
  permissions: ['users:read'],
};

const makeService = (config: Partial<{ accessSecret: string; accessTtl: string }> = {}) =>
  new JoseTokenService({ accessSecret: SECRET, accessTtl: '15m', ...config });

const signRaw = (claims: Record<string, unknown>, secret = SECRET) =>
  new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(secret));

describe('JoseTokenService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('round-trips the payload through sign and verify', async () => {
    const service = makeService();

    const token = await service.signAccessToken(payload);

    expect(await service.verifyAccessToken(token)).toEqual(payload);
  });

  it('puts the user id in the standard "sub" claim', async () => {
    const token = await makeService().signAccessToken(payload);

    const body = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString());
    expect(body).toMatchObject({ sub: 'user-1', clientApplicationId: 'app-1' });
    expect(body.exp).toBeGreaterThan(body.iat);
  });

  it('rejects a token signed with another secret', async () => {
    const token = await makeService({ accessSecret: 'x'.repeat(40) }).signAccessToken(payload);

    await expect(makeService().verifyAccessToken(token)).rejects.toThrow(InvalidAccessTokenError);
  });

  it('rejects a tampered token', async () => {
    const token = await makeService().signAccessToken(payload);
    const [header, , signature] = token.split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ ...payload, roles: ['root'], permissions: ['*:*'] }),
    ).toString('base64url');

    await expect(
      makeService().verifyAccessToken(`${header}.${forgedBody}.${signature}`),
    ).rejects.toThrow(InvalidAccessTokenError);
  });

  it('rejects garbage', async () => {
    await expect(makeService().verifyAccessToken('not-a-jwt')).rejects.toThrow(
      InvalidAccessTokenError,
    );
  });

  it('rejects an expired token', async () => {
    jest
      .useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] })
      .setSystemTime(new Date('2026-01-01T12:00:00Z'));
    const token = await makeService({ accessTtl: '1m' }).signAccessToken(payload);

    jest.setSystemTime(new Date('2026-01-01T12:02:00Z'));

    await expect(makeService().verifyAccessToken(token)).rejects.toThrow(InvalidAccessTokenError);
  });

  it('rejects an unsigned ("alg: none") token', async () => {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ ...payload })}.`;

    await expect(makeService().verifyAccessToken(unsigned)).rejects.toThrow(
      InvalidAccessTokenError,
    );
  });

  it.each([
    ['sub', { clientApplicationId: 'app-1', roles: [], permissions: [] }],
    ['clientApplicationId', { sub: 'user-1', roles: [], permissions: [] }],
    ['roles', { sub: 'user-1', clientApplicationId: 'app-1', permissions: [] }],
    ['permissions', { sub: 'user-1', clientApplicationId: 'app-1', roles: [] }],
  ])('rejects a validly signed token that lacks "%s"', async (_claim, claims) => {
    const token = await signRaw(claims);

    await expect(makeService().verifyAccessToken(token)).rejects.toThrow(InvalidAccessTokenError);
  });
});
