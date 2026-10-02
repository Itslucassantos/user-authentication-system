const { execFileSync } = require('node:child_process');
const { Client } = require('pg');
const { applyTestEnvironment } = require('./test-environment.cjs');

/** Creates the "<POSTGRES_DB>_test" database if needed and applies every migration to it. */
module.exports = async function globalSetup() {
  applyTestEnvironment();

  const testDb = process.env.POSTGRES_DB;
  const admin = new Client({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: 'postgres',
  });

  try {
    await admin.connect();
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      testDb,
    ]);
    if (rowCount === 0) {
      await admin.query(`CREATE DATABASE "${testDb}"`);
    }
  } catch (error) {
    throw new Error(
      `Could not reach PostgreSQL to prepare "${testDb}". Is it running? (docker compose up -d postgres redis)\n${error.message}`,
      { cause: error },
    );
  } finally {
    await admin.end().catch(() => undefined);
  }

  execFileSync('npx', ['tsx', 'src/infrastructure/database/migrate.ts', 'up'], {
    env: process.env,
    stdio: 'pipe',
  });
};
