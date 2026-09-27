import type { JwtConfig } from './jose-token.service.js';

const MIN_SECRET_LENGTH = 32;
const DEFAULT_ACCESS_TTL = '15m';

export function loadJwtConfig(env: NodeJS.ProcessEnv = process.env): JwtConfig {
  const secret = env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('Missing JWT environment variable: JWT_ACCESS_SECRET');
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_ACCESS_SECRET must have at least ${MIN_SECRET_LENGTH} characters`);
  }

  return {
    accessSecret: secret,
    accessTtl: env.JWT_ACCESS_TTL ?? DEFAULT_ACCESS_TTL,
  };
}
