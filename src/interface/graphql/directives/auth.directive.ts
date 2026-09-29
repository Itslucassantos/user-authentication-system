import { GraphQLError, type GraphQLSchema, defaultFieldResolver } from 'graphql';
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import type { GraphQLContext } from '../context.js';

const DIRECTIVE_NAME = 'auth';

export function applyAuthDirective(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, DIRECTIVE_NAME)?.[0] as
        { permission: string } | undefined;
      if (!authDirective) return fieldConfig;

      const { resolve = defaultFieldResolver } = fieldConfig;
      const { permission } = authDirective;

      return {
        ...fieldConfig,
        resolve(source, args, context: GraphQLContext, info) {
          if (!context.currentUser) {
            throw new GraphQLError('Authentication required', {
              extensions: { code: 'UNAUTHENTICATED' },
            });
          }
          if (!context.currentUser.permissions.includes(permission)) {
            throw new GraphQLError(`Missing permission "${permission}"`, {
              extensions: { code: 'FORBIDDEN' },
            });
          }
          return resolve(source, args, context, info);
        },
      };
    },
  });
}
