import { migrator } from './umzug.js';
import { sequelize } from './sequelize.js';

const command = process.argv[2] ?? 'up';

try {
  switch (command) {
    case 'up':
      await migrator.up();
      break;
    case 'down':
      await migrator.down();
      break;
    case 'pending':
      console.log((await migrator.pending()).map((m) => m.name));
      break;
    case 'executed':
      console.log((await migrator.executed()).map((m) => m.name));
      break;
    default:
      throw new Error(`Comando desconhecido: "${command}". Use up | down | pending | executed.`);
  }
} finally {
  await sequelize.close();
}
