import base from './jest.config.mjs';

// Integration suite: real PostgreSQL + Redis (see `docker compose up -d postgres redis`).
// Runs against a dedicated "<POSTGRES_DB>_test" database and Redis DB 15, never the dev data.
export default {
  ...base,
  transform: {
    '^.+\\.[jt]s$': '<rootDir>/jest.esbuild-transform.cjs',
  },
  testMatch: ['<rootDir>/src/**/*.int-spec.ts'],
  globalSetup: '<rootDir>/src/@testing/integration/global-setup.cjs',
  setupFiles: ['<rootDir>/src/@testing/integration/setup-env.cjs'],
  setupFilesAfterEnv: ['<rootDir>/src/@testing/integration/setup-after-env.ts'],
  // Every file shares the same database, so files must not run in parallel.
  maxWorkers: 1,
  testTimeout: 30_000,
  collectCoverageFrom: undefined,
};
