import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import type { MigrationParams } from 'umzug';

type Migration = (params: MigrationParams<QueryInterface>) => Promise<unknown>;

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('user_roles', {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    role_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      references: { model: 'roles', key: 'id' },
      onDelete: 'CASCADE',
    },
    client_application_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'client_applications', key: 'id' },
      onDelete: 'CASCADE',
    },
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('user_roles');
};
