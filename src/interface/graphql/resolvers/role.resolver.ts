import RoleNotFoundError from '../../../domain/role/error/role-not-found-error.js';
import { useCases } from '../../../container/index.js';
import type { GraphQLContext } from '../context.js';
import { toConnection } from '../pagination.js';
import { assertOwnClientApplication, isOwnClientApplication } from '../tenant-scope.js';
import type {
  GqlMutationAssignPermissionsToRoleArgs,
  GqlMutationCreateRoleArgs,
  GqlMutationDeleteRoleArgs,
  GqlMutationUpdateRoleArgs,
  GqlQueryRoleArgs,
  GqlQueryRolesArgs,
} from '../generated/schema-types.js';

async function loadOwnRole(roleId: string, ctx: GraphQLContext) {
  const role = await useCases.role.getRole.execute({ roleId });
  if (!role || !isOwnClientApplication(ctx, role.clientApplicationId)) {
    throw new RoleNotFoundError(roleId);
  }
  return role;
}

export const roleResolvers = {
  Query: {
    role: async (_: unknown, args: GqlQueryRoleArgs, ctx: GraphQLContext) => {
      const role = await useCases.role.getRole.execute({ roleId: args.id });
      return role && isOwnClientApplication(ctx, role.clientApplicationId) ? role : null;
    },

    roles: async (_: unknown, args: GqlQueryRolesArgs, ctx: GraphQLContext) => {
      assertOwnClientApplication(ctx, args.clientApplicationId);
      return toConnection(
        await useCases.role.listRoles.execute({
          clientApplicationId: args.clientApplicationId,
          page: args.page ?? 1,
          limit: args.limit ?? 20,
        }),
      );
    },
  },

  Mutation: {
    createRole: (_: unknown, args: GqlMutationCreateRoleArgs, ctx: GraphQLContext) => {
      assertOwnClientApplication(ctx, args.clientApplicationId);
      return useCases.role.createRole.execute(args);
    },

    updateRole: async (_: unknown, args: GqlMutationUpdateRoleArgs, ctx: GraphQLContext) => {
      await loadOwnRole(args.id, ctx);
      return useCases.role.updateRole.execute({
        roleId: args.id,
        name: args.name,
        description: args.description,
      });
    },

    assignPermissionsToRole: async (
      _: unknown,
      args: GqlMutationAssignPermissionsToRoleArgs,
      ctx: GraphQLContext,
    ) => {
      await loadOwnRole(args.roleId, ctx);
      return useCases.role.assignPermissionsToRole.execute(args);
    },

    deleteRole: async (
      _: unknown,
      args: GqlMutationDeleteRoleArgs,
      ctx: GraphQLContext,
    ): Promise<boolean> => {
      await loadOwnRole(args.id, ctx);
      await useCases.role.deleteRole.execute({ roleId: args.id });
      return true;
    },
  },
};
