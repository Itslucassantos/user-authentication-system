import { GraphQLError, type GraphQLSchema, defaultFieldResolver } from 'graphql';
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import type { GraphQLContext } from '../context.js';

const AUTH_DIRECTIVE = 'auth';
const AUTHENTICATED_DIRECTIVE = 'authenticated';

function requireAuthenticated(context: GraphQLContext): void {
  if (!context.currentUser) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

export function applyAuthDirective(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, AUTH_DIRECTIVE)?.[0] as
        { permission: string } | undefined;
      const authenticatedDirective = getDirective(
        schema,
        fieldConfig,
        AUTHENTICATED_DIRECTIVE,
      )?.[0];

      if (!authDirective && !authenticatedDirective) return fieldConfig;

      const { resolve = defaultFieldResolver } = fieldConfig;

      return {
        ...fieldConfig,
        resolve(source, args, context: GraphQLContext, info) {
          requireAuthenticated(context);
          if (
            authDirective &&
            !context.currentUser!.permissions.includes(authDirective.permission)
          ) {
            throw new GraphQLError(`Missing permission "${authDirective.permission}"`, {
              extensions: { code: 'FORBIDDEN' },
            });
          }
          return resolve(source, args, context, info);
        },
      };
    },
  });
}
