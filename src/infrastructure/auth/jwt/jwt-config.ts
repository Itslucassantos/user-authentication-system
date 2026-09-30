import { env } from '../../config/env.js';
import type { JwtConfig } from './jose-token.service.js';

export function loadJwtConfig(): JwtConfig {
  return {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
  };
}
