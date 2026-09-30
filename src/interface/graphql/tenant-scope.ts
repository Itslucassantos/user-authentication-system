import { GraphQLError } from 'graphql';
import type { GraphQLContext } from './context.js';

export function isOwnClientApplication(ctx: GraphQLContext, clientApplicationId: string): boolean {
  return ctx.currentUser?.clientApplicationId === clientApplicationId;
}

export function assertOwnClientApplication(ctx: GraphQLContext, clientApplicationId: string): void {
  if (!isOwnClientApplication(ctx, clientApplicationId)) {
    throw new GraphQLError('Cannot operate on a different client application', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}
