import { useCases } from '../../../container/index.js';
import { toConnection } from '../pagination.js';

export interface ListRolesArgs {
  clientApplicationId: string;
  page: number;
  limit: number;
}

export const roleResolvers = {
  Query: {
    role: (_: unknown, args: { id: string }) => useCases.role.getRole.execute({ roleId: args.id }),

    roles: async (_: unknown, args: ListRolesArgs) =>
      toConnection(await useCases.role.listRoles.execute(args)),
  },

  Mutation: {
    createRole: (
      _: unknown,
      args: {
        name: string;
        description: string;
        clientApplicationId: string;
        permissionIds: string[];
      },
    ) => useCases.role.createRole.execute(args),

    updateRole: (_: unknown, args: { id: string; name: string; description: string }) =>
      useCases.role.updateRole.execute({
        roleId: args.id,
        name: args.name,
        description: args.description,
      }),

    assignPermissionsToRole: (_: unknown, args: { roleId: string; permissionIds: string[] }) =>
      useCases.role.assignPermissionsToRole.execute(args),

    deleteRole: async (_: unknown, args: { id: string }): Promise<boolean> => {
      await useCases.role.deleteRole.execute({ roleId: args.id });
      return true;
    },
  },
};
