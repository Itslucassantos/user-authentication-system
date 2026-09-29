import { useCases } from '../../../container/index.js';
import { toConnection } from '../pagination.js';

export interface ListPermissionsArgs {
  clientApplicationId: string;
  page: number;
  limit: number;
}

export const permissionResolvers = {
  Query: {
    permission: (_: unknown, args: { id: string }) =>
      useCases.permission.getPermission.execute({ permissionId: args.id }),

    permissions: async (_: unknown, args: ListPermissionsArgs) =>
      toConnection(await useCases.permission.listPermissions.execute(args)),
  },

  Mutation: {
    createPermission: (
      _: unknown,
      args: {
        clientApplicationId: string;
        name: string;
        resource: string;
        action: string;
        description?: string;
      },
    ) => useCases.permission.createPermission.execute(args),

    updatePermission: (_: unknown, args: { id: string; description?: string }) =>
      useCases.permission.updatePermission.execute({
        permissionId: args.id,
        ...(args.description !== undefined ? { description: args.description } : {}),
      }),

    deletePermission: async (_: unknown, args: { id: string }): Promise<boolean> => {
      await useCases.permission.deletePermission.execute({ permissionId: args.id });
      return true;
    },
  },
};
