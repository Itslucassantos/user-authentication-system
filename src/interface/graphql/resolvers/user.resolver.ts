import UserNotFoundError from '../../../domain/user/error/user-not-found-error.js';
import type Role from '../../../domain/role/entity/role.js';
import { useCases } from '../../../container/index.js';
import type { GraphQLContext } from '../context.js';
import { toConnection } from '../pagination.js';
import { assertOwnClientApplication } from '../tenant-scope.js';
import type {
  GqlMutationActivateUserArgs,
  GqlMutationAssignRolesToUserArgs,
  GqlMutationCreateUserArgs,
  GqlMutationDeactivateUserArgs,
  GqlMutationDeleteUserArgs,
  GqlMutationRemoveRolesFromUserArgs,
  GqlMutationRequestPasswordResetArgs,
  GqlMutationSetPasswordArgs,
  GqlMutationUpdateUserArgs,
  GqlQueryUserArgs,
  GqlQueryUsersArgs,
  GqlUserRolesArgs,
} from '../generated/schema-types.js';

async function reloadUser(userId: string) {
  const user = await useCases.user.getUser.execute({ userId });
  if (!user) throw new UserNotFoundError(userId);
  return user;
}

export const userResolvers = {
  Query: {
    me: (_: unknown, __: unknown, ctx: GraphQLContext) =>
      ctx.currentUser ? useCases.user.getUser.execute({ userId: ctx.currentUser.sub }) : null,

    user: (_: unknown, args: GqlQueryUserArgs) =>
      useCases.user.getUser.execute({ userId: args.id }),

    users: async (_: unknown, args: GqlQueryUsersArgs, ctx: GraphQLContext) => {
      const clientApplicationId = args.clientApplicationId ?? ctx.currentUser?.clientApplicationId;
      if (clientApplicationId) assertOwnClientApplication(ctx, clientApplicationId);
      return toConnection(
        await useCases.user.listUsers.execute({
          page: args.page ?? 1,
          limit: args.limit ?? 20,
          ...(clientApplicationId ? { clientApplicationId } : {}),
        }),
      );
    },
  },

  Mutation: {
    createUser: (_: unknown, args: GqlMutationCreateUserArgs) =>
      useCases.user.createUser.execute(args.input),

    updateUser: (_: unknown, args: GqlMutationUpdateUserArgs) =>
      useCases.user.updateUser.execute({ userId: args.id, name: args.name }),

    activateUser: async (_: unknown, args: GqlMutationActivateUserArgs) => {
      await useCases.user.activateUser.execute({ userId: args.id });
      return reloadUser(args.id);
    },

    deactivateUser: async (_: unknown, args: GqlMutationDeactivateUserArgs) => {
      await useCases.user.deactivateUser.execute({ userId: args.id });
      return reloadUser(args.id);
    },

    deleteUser: async (_: unknown, args: GqlMutationDeleteUserArgs): Promise<boolean> => {
      await useCases.user.deleteUser.execute({ userId: args.id });
      return true;
    },

    setPassword: async (
      _: unknown,
      args: GqlMutationSetPasswordArgs,
      ctx: GraphQLContext,
    ): Promise<boolean> => {
      await useCases.user.setPassword.execute({ ...args, ipAddress: ctx.req.ip ?? 'unknown' });
      return true;
    },

    requestPasswordReset: async (
      _: unknown,
      args: GqlMutationRequestPasswordResetArgs,
    ): Promise<boolean> => {
      await useCases.auth.requestPasswordReset.execute(args);
      return true;
    },

    assignRolesToUser: async (
      _: unknown,
      args: GqlMutationAssignRolesToUserArgs,
      ctx: GraphQLContext,
    ) => {
      assertOwnClientApplication(ctx, args.clientApplicationId);
      await useCases.user.assignRolesToUser.execute(args);
      return reloadUser(args.userId);
    },

    removeRolesFromUser: async (
      _: unknown,
      args: GqlMutationRemoveRolesFromUserArgs,
      ctx: GraphQLContext,
    ) => {
      assertOwnClientApplication(ctx, args.clientApplicationId);
      await useCases.user.removeRolesFromUser.execute(args);
      return reloadUser(args.userId);
    },
  },

  User: {
    roles: async (
      parent: { id: string },
      args: GqlUserRolesArgs,
      ctx: GraphQLContext,
    ): Promise<Role[]> => {
      const clientApplicationId = args.clientApplicationId ?? ctx.currentUser?.clientApplicationId;
      if (!clientApplicationId) return [];
      assertOwnClientApplication(ctx, clientApplicationId);

      const roles = await ctx.loaders.rolesByUser.load(parent.id);
      return roles.filter((role) => role.clientApplicationId === clientApplicationId);
    },
  },
};
