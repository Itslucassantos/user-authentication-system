import express from 'express';
import { sequelize } from './infrastructure/database/sequelize.js';
import { redis } from './infrastructure/redis/redis-client.js';
import { mountGraphQL } from './interface/graphql/server.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = Number(process.env.PORT ?? 3000);

try {
  await sequelize.authenticate();
  console.log('PostgreSQL connected.');

  await redis.connect();
  console.log('Redis connected.');

  await mountGraphQL(app);
  console.log('GraphQL mounted at /graphql.');

  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
} catch (error) {
  console.error('Failed to start the application:', error);
  process.exit(1);
}
