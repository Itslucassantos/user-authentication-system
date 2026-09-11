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
  console.log('PostgreSQL conectado.');

  app.listen(port, () => {
    console.log(`API ouvindo na porta ${port}`);
  });
} catch (error) {
  console.error('Falha ao iniciar a aplicação:', error);
  process.exit(1);
}
