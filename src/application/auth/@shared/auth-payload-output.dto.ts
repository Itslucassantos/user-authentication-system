import type User from '../../../domain/user/entity/user.js';
import type { AccessTokenPayload } from '../../@shared/token-service.interface.js';

export interface AuthPayloadOutputDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    active: boolean;
  };
}

export const toAccessTokenPayload = (
  user: User,
  clientApplicationId: string,
): AccessTokenPayload => {
  const roles = user.rolesFor(clientApplicationId);
  const permissions = new Set(
    roles.flatMap((role) =>
      role.permissions.map((permission) => `${permission.resource}:${permission.action}`),
    ),
  );

  return {
    sub: user.id,
    clientApplicationId,
    roles: roles.map((role) => role.name),
    permissions: [...permissions],
  };
};

export const toAuthPayloadOutputDto = (
  user: User,
  accessToken: string,
  refreshToken: string,
): AuthPayloadOutputDto => ({
  accessToken,
  refreshToken,
  user: {
    id: user.id,
    name: user.name,
    email: user.email.value,
    active: user.active,
  },
});
