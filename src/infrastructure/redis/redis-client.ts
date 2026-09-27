import { Redis } from 'ioredis';

try {
  process.loadEnvFile();
} catch {
  console.warn('.env file not found, using process.env');
}

export const redis = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  lazyConnect: true,
  ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
});
