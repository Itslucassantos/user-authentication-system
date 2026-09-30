import { makeExecutableSchema } from '@graphql-tools/schema';
import type { GraphQLSchema } from 'graphql';
import { applyAuthDirective } from '../directives/auth.directive.js';
import { resolvers } from '../resolvers/index.js';
import sharedSchema from './shared.schema.js';
import authSchema from './auth.schema.js';
import userSchema from './user.schema.js';
import roleSchema from './role.schema.js';
import permissionSchema from './permission.schema.js';
import clientApplicationSchema from './client-application.schema.js';

const typeDefs = [
  sharedSchema,
  authSchema,
  userSchema,
  roleSchema,
  permissionSchema,
  clientApplicationSchema,
];

export const schema: GraphQLSchema = applyAuthDirective(
  makeExecutableSchema({ typeDefs, resolvers }),
);
