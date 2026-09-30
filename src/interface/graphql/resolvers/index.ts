import { authResolvers } from './auth.resolver.js';
import { userResolvers } from './user.resolver.js';
import { roleResolvers } from './role.resolver.js';
import { permissionResolvers } from './permission.resolver.js';
import { clientApplicationResolvers } from './client-application.resolver.js';

export const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...roleResolvers.Query,
    ...permissionResolvers.Query,
    ...clientApplicationResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...roleResolvers.Mutation,
    ...permissionResolvers.Mutation,
    ...clientApplicationResolvers.Mutation,
  },
  User: userResolvers.User,
};
