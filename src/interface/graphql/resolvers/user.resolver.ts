import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import type Role from '../../../domain/role/entity/role.js';
import { useCases } from '../../../container/index.js';
import type { GraphQLContext } from '../context.js';
import { toConnection } from '../pagination.js';

export interface ListUsersArgs {
  clientApplicationId?: string;
  page: number;
  limit: number;
}

export interface RolesArgs {
  userId: string;
  roleIds: string[];
  clientApplicationId: string;
}

async function reloadUser(userId: string) {
  const user = await useCases.user.getUser.execute({ userId });
  if (!user) throw new UserNotFoundError(userId);
  return user;
}

export const userResolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: GraphQLContext) =>
      ctx.currentUser ? useCases.user.getUser.execute({ userId: ctx.currentUser.sub }) : null,

    user: (_: unknown, args: { id: string }) => useCases.user.getUser.execute({ userId: args.id }),

    users: async (_: unknown, args: ListUsersArgs) =>
      toConnection(await useCases.user.listUsers.execute(args)),
  },

  Mutation: {
    createUser: (_: unknown, args: { input: { name: string; email: string } }) =>
      useCases.user.createUser.execute(args.input),

    updateUser: (_: unknown, args: { id: string; name: string }) =>
      useCases.user.updateUser.execute({ userId: args.id, name: args.name }),

    activateUser: async (_: unknown, args: { id: string }) => {
      await useCases.user.activateUser.execute({ userId: args.id });
      return reloadUser(args.id);
    },

    deactivateUser: async (_: unknown, args: { id: string }) => {
      await useCases.user.deactivateUser.execute({ userId: args.id });
      return reloadUser(args.id);
    },

    deleteUser: async (_: unknown, args: { id: string }): Promise<boolean> => {
      await useCases.user.deleteUser.execute({ userId: args.id });
      return true;
    },

    setPassword: async (
      _: unknown,
      args: { token: string; newPassword: string },
      ctx: GraphQLContext,
    ): Promise<boolean> => {
      await useCases.user.setPassword.execute({ ...args, ipAddress: ctx.req.ip ?? 'unknown' });
      return true;
    },

    requestPasswordReset: async (_: unknown, args: { email: string }): Promise<boolean> => {
      await useCases.auth.requestPasswordReset.execute(args);
      return true;
    },

    assignRolesToUser: async (_: unknown, args: RolesArgs) => {
      await useCases.user.assignRolesToUser.execute(args);
      return reloadUser(args.userId);
    },

    removeRolesFromUser: async (_: unknown, args: RolesArgs) => {
      await useCases.user.removeRolesFromUser.execute(args);
      return reloadUser(args.userId);
    },
  },

  User: {
    roles: async (
      parent: { id: string },
      args: { clientApplicationId?: string },
      ctx: GraphQLContext,
    ): Promise<Role[]> => {
      const roles = await ctx.loaders.rolesByUser.load(parent.id);
      return args.clientApplicationId
        ? roles.filter((role) => role.clientApplicationId === args.clientApplicationId)
        : roles;
    },
  },
};
