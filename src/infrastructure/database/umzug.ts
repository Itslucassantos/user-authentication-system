import { fileURLToPath } from 'node:url';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './sequelize.js';

const migrationsDir = fileURLToPath(new URL('./migrations', import.meta.url));

export const migrator = new Umzug({
  // .ts em dev (tsx), .js após build (dist/) — nunca coexistem no mesmo diretório
  migrations: { glob: ['*.{ts,js}', { cwd: migrationsDir }] },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});
