import { z } from 'zod';

try {
  process.loadEnvFile();
} catch {
  console.warn('.env file not found, using process.env');
}

const port = z.coerce.number().int().positive();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: port.default(3000),
    TRUST_PROXY: z.stringbool().default(false),

    POSTGRES_HOST: z.string().min(1).default('localhost'),
    POSTGRES_PORT: port.default(5432),
    POSTGRES_DB: z.string().min(1).default('auth_db'),
    POSTGRES_USER: z.string().min(1).default('auth_user'),
    POSTGRES_PASSWORD: z.string().default(''),

    REDIS_HOST: z.string().min(1).default('localhost'),
    REDIS_PORT: port.default(6379),
    REDIS_DB: z.coerce.number().int().min(0).default(0),
    REDIS_PASSWORD: z.string().min(1).optional(),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must have at least 32 characters'),
    JWT_ACCESS_TTL: z.string().min(1).default('15m'),

    MAIL_HOST: z.string().min(1).optional(),
    MAIL_PORT: port.optional(),
    MAIL_USER: z.string().min(1).optional(),
    MAIL_PASSWORD: z.string().min(1).optional(),
    MAIL_FROM: z.string().min(1).optional(),

    APP_BASE_URL: z.url(),

    CORS_ALLOWED_ORIGINS: z.string().min(1).optional(),

    LOGIN_IP_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(30),
    LOGIN_IP_RATE_LIMIT_BLOCK_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(2 * 60 * 60),
  })
  .refine((data) => Boolean(data.MAIL_USER) === Boolean(data.MAIL_PASSWORD), {
    message: 'MAIL_USER and MAIL_PASSWORD must be set together',
    path: ['MAIL_USER'],
  });

export type Env = z.infer<typeof envSchema>;

function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid environment configuration:\n${issues.join('\n')}`);
  }
  return result.data;
}

export const env: Env = parseEnv(process.env);

/**
 * `true` means "reflect any Origin" (cors' own contract for that value); an array is the
 * explicit allowlist. Production defaults to deny-all so a missing env var fails closed
 * instead of silently staying wide open.
 */
export function corsAllowedOrigins(config: Env = env): true | string[] {
  if (config.CORS_ALLOWED_ORIGINS) {
    return config.CORS_ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
  return config.NODE_ENV === 'production' ? [] : true;
}
