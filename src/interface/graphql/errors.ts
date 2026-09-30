import { unwrapResolverError } from '@apollo/server/errors';
import { GraphQLError, type GraphQLFormattedError } from 'graphql';
import TooManyRequestsError from '../../application/@shared/too-many-requests-error.js';
import { logger } from '../../infrastructure/logging/logger.js';

const NOT_FOUND = new Set([
  'UserNotFoundError',
  'RoleNotFoundError',
  'PermissionNotFoundError',
  'ClientApplicationNotFoundError',
  'PasswordTokenNotFoundError',
  'RefreshTokenNotFoundError',
]);

const CONFLICT = new Set([
  'UserAlreadyExistsError',
  'RoleAlreadyExistsError',
  'PermissionAlreadyExistsError',
  'ClientApplicationAlreadyExistsError',
  'PermissionInUseError',
]);

const UNAUTHENTICATED = new Set([
  'InvalidCredentialsError',
  'InvalidClientError',
  'InvalidRefreshTokenError',
  'InvalidAccessTokenError',
]);

export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const original = unwrapResolverError(error);

  if (original instanceof GraphQLError) {
    return formattedError;
  }

  if (original instanceof TooManyRequestsError) {
    return {
      ...formattedError,
      message: original.message,
      extensions: { code: 'TOO_MANY_REQUESTS', retryAfterSeconds: original.retryAfterSeconds },
    };
  }

  if (original instanceof Error) {
    if (NOT_FOUND.has(original.name)) return withCode(formattedError, original, 'NOT_FOUND');
    if (CONFLICT.has(original.name)) return withCode(formattedError, original, 'CONFLICT');
    if (UNAUTHENTICATED.has(original.name))
      return withCode(formattedError, original, 'UNAUTHENTICATED');

    if (original.name === 'Error') return withCode(formattedError, original, 'BAD_USER_INPUT');
  }

  logger.error({ err: original }, 'Unhandled GraphQL error');
  return {
    ...formattedError,
    message: 'Internal server error',
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  };
}

function withCode(
  formattedError: GraphQLFormattedError,
  original: Error,
  code: string,
): GraphQLFormattedError {
  return { ...formattedError, message: original.message, extensions: { code } };
}
