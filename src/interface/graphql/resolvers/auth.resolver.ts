import { useCases } from '../../../container/index.js';
import type { GraphQLContext } from '../context.js';
import type {
  GqlMutationLoginArgs,
  GqlMutationLogoutArgs,
  GqlMutationRefreshTokenArgs,
} from '../generated/schema-types.js';

export const authResolvers = {
  Mutation: {
    login: (_: unknown, args: GqlMutationLoginArgs, ctx: GraphQLContext) =>
      useCases.auth.login.execute({
        ...args,
        deviceInfo: ctx.req.headers['user-agent'] ?? 'unknown',
        ipAddress: ctx.req.ip ?? 'unknown',
      }),

    refreshToken: (_: unknown, args: GqlMutationRefreshTokenArgs) =>
      useCases.auth.refreshToken.execute(args),

    logout: async (_: unknown, args: GqlMutationLogoutArgs): Promise<boolean> => {
      await useCases.auth.logout.execute(args);
      return true;
    },

    logoutAllDevices: async (_: unknown, __: unknown, ctx: GraphQLContext): Promise<boolean> => {
      await useCases.auth.logoutAllDevices.execute({ userId: ctx.currentUser!.sub });
      return true;
    },
  },
};
