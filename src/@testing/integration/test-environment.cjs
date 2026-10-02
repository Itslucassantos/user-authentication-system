/**
 * Resolves the environment used by the integration suite. Shared by the global setup (parent
 * process) and the per-file setup, so both point at the same isolated PostgreSQL database and
 * Redis DB, never at the development data.
 */
const TEST_REDIS_DB = '15';

function loadEnvFile() {
  try {
    process.loadEnvFile();
  } catch {
    // no .env file (e.g. CI): the variables come from the process environment
  }
}

function applyTestEnvironment() {
  loadEnvFile();

  const baseDb = process.env.POSTGRES_DB ?? 'auth_db';
  process.env.POSTGRES_DB = baseDb.endsWith('_test') ? baseDb : `${baseDb}_test`;
  process.env.POSTGRES_USER ??= 'auth_user';
  process.env.POSTGRES_PASSWORD ??= '';
  process.env.REDIS_DB = TEST_REDIS_DB;

  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET ??= 'integration-test-secret-with-at-least-32-chars';
  process.env.JWT_ACCESS_TTL = '15m';
  process.env.APP_BASE_URL = 'http://localhost:3000';
  process.env.LOGIN_IP_RATE_LIMIT_MAX_ATTEMPTS = '30';

  // Mails are captured in memory (see setup-after-env.ts); these only satisfy the config schema.
  process.env.MAIL_HOST = 'smtp.invalid';
  process.env.MAIL_PORT = '587';
  process.env.MAIL_USER = 'test';
  process.env.MAIL_PASSWORD = 'test';
  process.env.MAIL_FROM = 'Auth Service <test@example.com>';
}

module.exports = { applyTestEnvironment, TEST_REDIS_DB };
