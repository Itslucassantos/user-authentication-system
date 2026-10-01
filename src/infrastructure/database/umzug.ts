import { fileURLToPath, pathToFileURL } from 'node:url';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './sequelize.js';

const migrationsDir = fileURLToPath(new URL('./migrations', import.meta.url));

export const migrator = new Umzug({
  // .ts em dev (tsx), .js após build (dist/) — never coexist in the same directory
  migrations: {
    glob: ['*.{ts,js}', { cwd: migrationsDir, ignore: ['*.d.ts'] }],
    // Same recorded name whether run via tsx or from dist/, so both share one history
    resolve: ({ name, path, context }) => ({
      name: name.replace(/\.js$/, '.ts'),
      up: async () => (await import(pathToFileURL(path!).href)).up({ name, path, context }),
      down: async () => (await import(pathToFileURL(path!).href)).down({ name, path, context }),
    }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});
