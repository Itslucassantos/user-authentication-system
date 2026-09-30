import PermissionNotFoundError from '../../../domain/role/error/permission-not-found-error.js';
import { useCases } from '../../../container/index.js';
import type { GraphQLContext } from '../context.js';
import { toConnection } from '../pagination.js';
import { assertOwnClientApplication, isOwnClientApplication } from '../tenant-scope.js';
import type {
  GqlMutationCreatePermissionArgs,
  GqlMutationDeletePermissionArgs,
  GqlMutationUpdatePermissionArgs,
  GqlQueryPermissionArgs,
  GqlQueryPermissionsArgs,
} from '../generated/schema-types.js';

async function loadOwnPermission(permissionId: string, ctx: GraphQLContext) {
  const permission = await useCases.permission.getPermission.execute({ permissionId });
  if (!permission || !isOwnClientApplication(ctx, permission.clientApplicationId)) {
    throw new PermissionNotFoundError(permissionId);
  }
  return permission;
}

export const permissionResolvers = {
  Query: {
    permission: async (_: unknown, args: GqlQueryPermissionArgs, ctx: GraphQLContext) => {
      const permission = await useCases.permission.getPermission.execute({
        permissionId: args.id,
      });
      return permission && isOwnClientApplication(ctx, permission.clientApplicationId)
        ? permission
        : null;
    },

    permissions: async (_: unknown, args: GqlQueryPermissionsArgs, ctx: GraphQLContext) => {
      assertOwnClientApplication(ctx, args.clientApplicationId);
      return toConnection(
        await useCases.permission.listPermissions.execute({
          clientApplicationId: args.clientApplicationId,
          page: args.page ?? 1,
          limit: args.limit ?? 20,
        }),
      );
    },
  },

  Mutation: {
    createPermission: (_: unknown, args: GqlMutationCreatePermissionArgs, ctx: GraphQLContext) => {
      assertOwnClientApplication(ctx, args.clientApplicationId);
      return useCases.permission.createPermission.execute({
        clientApplicationId: args.clientApplicationId,
        name: args.name,
        resource: args.resource,
        action: args.action,
        ...(args.description != null ? { description: args.description } : {}),
      });
    },

    updatePermission: async (
      _: unknown,
      args: GqlMutationUpdatePermissionArgs,
      ctx: GraphQLContext,
    ) => {
      await loadOwnPermission(args.id, ctx);
      return useCases.permission.updatePermission.execute({
        permissionId: args.id,
        ...(args.description != null ? { description: args.description } : {}),
      });
    },

    deletePermission: async (
      _: unknown,
      args: GqlMutationDeletePermissionArgs,
      ctx: GraphQLContext,
    ): Promise<boolean> => {
      await loadOwnPermission(args.id, ctx);
      await useCases.permission.deletePermission.execute({ permissionId: args.id });
      return true;
    },
  },
};
