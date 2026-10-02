import { QueryTypes } from 'sequelize';
import { env } from '../../infrastructure/config/env.js';
import { sequelize } from '../../infrastructure/database/sequelize.js';
import { redis } from '../../infrastructure/redis/redis-client.js';
import { CapturedMailer } from './captured-mail.js';

/** Last line of defense: these helpers wipe data, so they only ever run on the test databases. */
function assertTestEnvironment(): void {
  if (!env.POSTGRES_DB.endsWith('_test') || env.REDIS_DB !== 15) {
    throw new Error('Refusing to wipe data: not running against the integration test databases.');
  }
}

export async function connectInfrastructure(): Promise<void> {
  assertTestEnvironment();
  await sequelize.authenticate();
  if (redis.status === 'wait') await redis.connect();
}

export async function disconnectInfrastructure(): Promise<void> {
  await Promise.allSettled([sequelize.close(), redis.quit()]);
}

/** Empties every table (except the migrations history) and the whole test Redis DB. */
export async function resetState(): Promise<void> {
  assertTestEnvironment();

  const tables = await sequelize.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'SequelizeMeta'`,
    { type: QueryTypes.SELECT },
  );
  if (tables.length > 0) {
    const names = tables.map(({ tablename }) => `"${tablename}"`).join(', ');
    await sequelize.query(`TRUNCATE ${names} RESTART IDENTITY CASCADE`);
  }

  await redis.flushdb();
  CapturedMailer.clear();
}
