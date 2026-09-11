import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import type { MigrationParams } from 'umzug';

type Migration = (params: MigrationParams<QueryInterface>) => Promise<unknown>;

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('role_permissions', {
    role_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      references: { model: 'roles', key: 'id' },
      onDelete: 'CASCADE',
    },
    permission_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      references: { model: 'permissions', key: 'id' },
      onDelete: 'CASCADE',
    },
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('role_permissions');
};
