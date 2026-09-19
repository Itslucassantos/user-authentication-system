import { v4 as uuid } from 'uuid';
import PasswordToken from '../entity/password-token.js';
import { PasswordTokenType } from '../enum/password-token-type.enum.js';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export default class PasswordTokenFactory {
  static createInvitation(userId: string, tokenHash: string): PasswordToken {
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
    return new PasswordToken(uuid(), userId, PasswordTokenType.INVITATION, tokenHash, expiresAt);
  }

  static createPasswordReset(userId: string, tokenHash: string): PasswordToken {
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    return new PasswordToken(
      uuid(),
      userId,
      PasswordTokenType.PASSWORD_RESET,
      tokenHash,
      expiresAt,
    );
  }

  static restore(
    id: string,
    userId: string,
    type: PasswordTokenType,
    tokenHash: string,
    expiresAt: Date,
    used: boolean,
  ): PasswordToken {
    const token = new PasswordToken(id, userId, type, tokenHash, expiresAt);
    if (used) token.markUsed();
    return token;
  }
}
