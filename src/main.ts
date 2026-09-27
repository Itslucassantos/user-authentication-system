import express from 'express';
import { sequelize } from './infrastructure/database/sequelize.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = Number(process.env.PORT ?? 3000);

try {
  await sequelize.authenticate();
  console.log('PostgreSQL connected.');

  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
} catch (error) {
  console.error('Failed to start the application:', error);
  process.exit(1);
}
