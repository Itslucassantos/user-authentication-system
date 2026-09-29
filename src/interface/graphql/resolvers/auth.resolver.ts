import { useCases } from '../../../container/index.js';
import type { GraphQLContext } from '../context.js';

export interface LoginArgs {
  email: string;
  password: string;
  clientId: string;
}

export const authResolvers = {
  Mutation: {
    login: (_: unknown, args: LoginArgs, ctx: GraphQLContext) =>
      useCases.auth.login.execute({
        ...args,
        deviceInfo: ctx.req.headers['user-agent'] ?? 'unknown',
      }),

    refreshToken: (_: unknown, args: { refreshToken: string }) =>
      useCases.auth.refreshToken.execute(args),

    logout: async (_: unknown, args: { refreshToken: string }): Promise<boolean> => {
      await useCases.auth.logout.execute(args);
      return true;
    },

    logoutAllDevices: async (_: unknown, __: unknown, ctx: GraphQLContext): Promise<boolean> => {
      await useCases.auth.logoutAllDevices.execute({ userId: ctx.currentUser!.sub });
      return true;
    },
  },
};
