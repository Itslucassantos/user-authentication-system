import type { ExpressContextFunctionArgument } from '@as-integrations/express5';
import type { AccessTokenPayload } from '../../application/@shared/token-service.interface.js';
import { tokenService } from '../../container/index.js';
import { createRolesByUserLoader } from './dataloaders/roles-by-user.loader.js';

export interface GraphQLContext {
  req: ExpressContextFunctionArgument['req'];
  currentUser: AccessTokenPayload | null;
  loaders: {
    rolesByUser: ReturnType<typeof createRolesByUserLoader>;
  };
}

const BEARER_PREFIX = 'Bearer ';

export async function createContext({
  req,
}: ExpressContextFunctionArgument): Promise<GraphQLContext> {
  return {
    req,
    currentUser: await resolveCurrentUser(req.headers.authorization),
    loaders: { rolesByUser: createRolesByUserLoader() },
  };
}

async function resolveCurrentUser(
  authorizationHeader?: string,
): Promise<AccessTokenPayload | null> {
  if (!authorizationHeader?.startsWith(BEARER_PREFIX)) return null;

  try {
    return await tokenService.verifyAccessToken(authorizationHeader.slice(BEARER_PREFIX.length));
  } catch {
    return null;
  }
}
