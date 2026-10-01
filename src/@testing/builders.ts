import { randomUUID } from 'node:crypto';
import type PasswordToken from '../domain/auth/entity/password-token.js';
import type RefreshToken from '../domain/auth/entity/refresh-token.js';
import { PasswordTokenType } from '../domain/auth/enum/password-token-type.enum.js';
import PasswordTokenFactory from '../domain/auth/factory/password-token.factory.js';
import RefreshTokenFactory from '../domain/auth/factory/refresh-token.factory.js';
import type ClientApplication from '../domain/client-application/entity/client-application.js';
import ClientApplicationFactory from '../domain/client-application/factory/client-application.factory.js';
import type Permission from '../domain/role/entity/permission.js';
import type Role from '../domain/role/entity/role.js';
import PermissionFactory from '../domain/role/factory/permission.factory.js';
import RoleFactory from '../domain/role/factory/role.factory.js';
import type User from '../domain/user/entity/user.js';
import UserFactory from '../domain/user/factory/user.factory.js';
import Email from '../domain/user/value-object/email.js';

export const CLIENT_APPLICATION_ID = 'client-application-1';
export const OTHER_CLIENT_APPLICATION_ID = 'client-application-2';

const DAY_MS = 24 * 60 * 60 * 1000;

export const makePermission = (
  overrides: Partial<{
    id: string;
    clientApplicationId: string;
    name: string;
    resource: string;
    action: string;
    description: string;
  }> = {},
): Permission =>
  PermissionFactory.restore(
    overrides.id ?? randomUUID(),
    overrides.clientApplicationId ?? CLIENT_APPLICATION_ID,
    overrides.name ?? 'Read users',
    overrides.resource ?? 'users',
    overrides.action ?? 'read',
    overrides.description ?? 'Allows reading users',
  );

export const makeRole = (
  overrides: Partial<{
    id: string;
    clientApplicationId: string;
    name: string;
    description: string;
    permissions: Permission[];
  }> = {},
): Role => {
  const clientApplicationId = overrides.clientApplicationId ?? CLIENT_APPLICATION_ID;
  return RoleFactory.restore(
    overrides.id ?? randomUUID(),
    clientApplicationId,
    overrides.name ?? 'admin',
    overrides.description ?? 'Administrator',
    overrides.permissions ?? [makePermission({ clientApplicationId })],
  );
};

export const makeUser = (
  overrides: Partial<{
    id: string;
    name: string;
    email: string;
    passwordHash: string | null;
    active: boolean;
    roles: Role[];
  }> = {},
): User =>
  UserFactory.restore({
    id: overrides.id ?? randomUUID(),
    name: overrides.name ?? 'John Doe',
    email: new Email(overrides.email ?? 'john.doe@example.com'),
    passwordHash:
      overrides.passwordHash === undefined ? 'hashed:Secret123' : overrides.passwordHash,
    active: overrides.active ?? true,
    roles: overrides.roles ?? [],
  });

export const makeClientApplication = (
  overrides: Partial<{
    id: string;
    name: string;
    clientId: string;
    clientSecretHash: string;
    redirectUris: string[];
    active: boolean;
    roles: Role[];
  }> = {},
): ClientApplication =>
  ClientApplicationFactory.restore(
    overrides.id ?? CLIENT_APPLICATION_ID,
    overrides.name ?? 'Back Office',
    overrides.clientId ?? 'client-id-1',
    overrides.clientSecretHash ?? 'hashed:client-secret',
    overrides.redirectUris ?? ['https://app.example.com/callback'],
    overrides.active ?? true,
    overrides.roles,
  );

export const makeRefreshToken = (
  overrides: Partial<{
    id: string;
    userId: string;
    clientApplicationId: string;
    tokenHash: string;
    deviceInfo: string;
    expiresAt: Date;
    revoked: boolean;
  }> = {},
): RefreshToken =>
  RefreshTokenFactory.restore(
    overrides.id ?? randomUUID(),
    overrides.userId ?? 'user-1',
    overrides.clientApplicationId ?? CLIENT_APPLICATION_ID,
    overrides.tokenHash ?? randomUUID(),
    overrides.deviceInfo ?? 'Firefox on Linux',
    overrides.expiresAt ?? new Date(Date.now() + 30 * DAY_MS),
    overrides.revoked ?? false,
  );

export const makePasswordToken = (
  overrides: Partial<{
    id: string;
    userId: string;
    type: PasswordTokenType;
    tokenHash: string;
    expiresAt: Date;
    used: boolean;
  }> = {},
): PasswordToken =>
  PasswordTokenFactory.restore(
    overrides.id ?? randomUUID(),
    overrides.userId ?? 'user-1',
    overrides.type ?? PasswordTokenType.PASSWORD_RESET,
    overrides.tokenHash ?? randomUUID(),
    overrides.expiresAt ?? new Date(Date.now() + DAY_MS),
    overrides.used ?? false,
  );
