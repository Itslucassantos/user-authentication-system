import { execFileSync } from 'node:child_process';
import { QueryTypes } from 'sequelize';
import { useIntegrationInfrastructure } from '../../@testing/integration/lifecycle.js';
import { sequelize } from './sequelize.js';
import { migrator } from './umzug.js';

const tableNames = async () =>
  (
    await sequelize.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
      { type: QueryTypes.SELECT },
    )
  ).map(({ tablename }) => tablename);

describe('Migrations (PostgreSQL)', () => {
  useIntegrationInfrastructure();

  it('are all applied on the test database', async () => {
    expect(await migrator.pending()).toEqual([]);
    expect((await migrator.executed()).length).toBeGreaterThan(0);
  });

  it('record the same names whether run from .ts (tsx) or .js (dist/)', async () => {
    const names = (await migrator.executed()).map((migration) => migration.name);
    expect(names.every((name) => name.endsWith('.ts'))).toBe(true);
  });

  it('create the schema the models expect', async () => {
    expect(await tableNames()).toEqual(
      expect.arrayContaining([
        'users',
        'client_applications',
        'roles',
        'permissions',
        'user_roles',
        'role_permissions',
        'password_tokens',
      ]),
    );
  });

  it('can roll the latest one back and re-apply it through the migrate CLI', () => {
    const migrate = (command: string) =>
      execFileSync('npx', ['tsx', 'src/infrastructure/database/migrate.ts', command], {
        env: process.env,
        stdio: 'pipe',
      });

    migrate('down');
    return migrator
      .pending()
      .then((pending) => {
        expect(pending).toHaveLength(1);
        migrate('up');
        return migrator.pending();
      })
      .then((pending) => expect(pending).toEqual([]));
  });
});
