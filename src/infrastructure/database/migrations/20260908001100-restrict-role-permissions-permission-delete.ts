import type { QueryInterface } from 'sequelize';
import type { MigrationParams } from 'umzug';

type Migration = (params: MigrationParams<QueryInterface>) => Promise<unknown>;

const CONSTRAINT_NAME = 'role_permissions_permission_id_fkey';

const replaceForeignKey = async (
  queryInterface: QueryInterface,
  onDelete: 'RESTRICT' | 'CASCADE',
) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.removeConstraint('role_permissions', CONSTRAINT_NAME, { transaction });
    await queryInterface.addConstraint('role_permissions', {
      fields: ['permission_id'],
      type: 'foreign key',
      name: CONSTRAINT_NAME,
      references: { table: 'permissions', field: 'id' },
      onDelete,
      onUpdate: 'NO ACTION',
      transaction,
    });
  });
};

export const up: Migration = async ({ context: queryInterface }) => {
  await replaceForeignKey(queryInterface, 'RESTRICT');
};

export const down: Migration = async ({ context: queryInterface }) => {
  await replaceForeignKey(queryInterface, 'CASCADE');
};
