import { makePasswordToken, makeUser } from '../../../../@testing/builders.js';
import { useIntegrationInfrastructure } from '../../../../@testing/integration/lifecycle.js';
import { PasswordTokenType } from '../../../../domain/auth/enum/password-token-type.enum.js';
import PasswordTokenNotFoundError from '../../../../domain/auth/error/password-token-not-found-error.js';
import UserRepository from '../../../user/repository/sequelize/user.repository.js';
import PasswordTokenRepository from './password-token.repository.js';

describe('PasswordTokenRepository (PostgreSQL)', () => {
  useIntegrationInfrastructure();
  const users = new UserRepository();
  const tokens = new PasswordTokenRepository();

  async function persistedUser() {
    const user = makeUser();
    await users.save(user);
    return user;
  }

  it('saves a token and finds it by id and by hash', async () => {
    const user = await persistedUser();
    const token = makePasswordToken({
      userId: user.id,
      type: PasswordTokenType.INVITATION,
      tokenHash: 'hash-1',
    });
    await tokens.save(token);

    for (const found of [await tokens.findById(token.id), await tokens.findByTokenHash('hash-1')]) {
      expect(found).toMatchObject({
        id: token.id,
        userId: user.id,
        type: PasswordTokenType.INVITATION,
        used: false,
      });
      expect(found?.expiresAt.getTime()).toBe(token.expiresAt.getTime());
    }
    expect(await tokens.findByTokenHash('unknown')).toBeNull();
  });

  it('marks a token as used', async () => {
    const user = await persistedUser();
    const token = makePasswordToken({ userId: user.id });
    await tokens.save(token);

    token.markUsed();
    await tokens.update(token);

    expect((await tokens.findById(token.id))?.used).toBe(true);
  });

  it('throws PasswordTokenNotFoundError when updating or deleting a missing token', async () => {
    const token = makePasswordToken();
    await expect(tokens.update(token)).rejects.toBeInstanceOf(PasswordTokenNotFoundError);
    await expect(tokens.delete(token.id)).rejects.toBeInstanceOf(PasswordTokenNotFoundError);
  });

  it('rejects a token for a user that does not exist (FK)', async () => {
    await expect(tokens.save(makePasswordToken({ userId: 'ghost' }))).rejects.toThrow(
      'Failed to save password token',
    );
  });

  it('deletes tokens and paginates', async () => {
    const user = await persistedUser();
    const [a, b, c] = [1, 2, 3].map((n) =>
      makePasswordToken({ userId: user.id, tokenHash: `hash-${n}` }),
    );
    for (const token of [a!, b!, c!]) await tokens.save(token);
    await tokens.delete(c!.id);

    const page = await tokens.findAll({ page: 1, limit: 1 });
    expect(page).toMatchObject({ total: 2, totalPages: 2 });
  });

  it('removes a user tokens when the user is deleted (cascade)', async () => {
    const user = await persistedUser();
    await tokens.save(makePasswordToken({ userId: user.id, tokenHash: 'cascade' }));

    await users.delete(user.id);
    expect(await tokens.findByTokenHash('cascade')).toBeNull();
  });
});
