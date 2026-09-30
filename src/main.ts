import express from 'express';
import { pinoHttp } from 'pino-http';
import { env } from './infrastructure/config/env.js';
import { logger } from './infrastructure/logging/logger.js';
import { sequelize } from './infrastructure/database/sequelize.js';
import { redis } from './infrastructure/redis/redis-client.js';
import { GRAPHQL_PATH, mountGraphQL } from './interface/graphql/server.js';

const app = express();
app.set('trust proxy', env.TRUST_PROXY);
app.use(pinoHttp({ logger }));
app.use(express.json());

app.get('/health', async (_req, res) => {
  const [postgres, redisStatus] = await Promise.all([
    sequelize
      .authenticate()
      .then(() => true as const)
      .catch(() => false as const),
    redis
      .ping()
      .then(() => true as const)
      .catch(() => false as const),
  ]);

  const healthy = postgres && redisStatus;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'unavailable',
    dependencies: { postgres, redis: redisStatus },
  });
});

try {
  await sequelize.authenticate();
  logger.info('PostgreSQL connected.');

  await redis.connect();
  logger.info('Redis connected.');

  await mountGraphQL(app);
  logger.info(`GraphQL mounted at ${GRAPHQL_PATH}.`);

  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received, shutting down gracefully.`);

    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit.');
      process.exit(1);
    }, 10_000);
    forceExitTimer.unref();

    server.close(async (error) => {
      if (error) logger.error({ err: error }, 'Error while closing the HTTP server.');
      await Promise.allSettled([sequelize.close(), redis.quit()]);
      clearTimeout(forceExitTimer);
      process.exit(error ? 1 : 0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
} catch (error) {
  logger.error({ err: error }, 'Failed to start the application.');
  process.exit(1);
}
