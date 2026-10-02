import { Redis } from 'ioredis';
import { env } from '../config/env.js';

export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  db: env.REDIS_DB,
  lazyConnect: true,
  ...(env.REDIS_PASSWORD ? { password: env.REDIS_PASSWORD } : {}),
});
