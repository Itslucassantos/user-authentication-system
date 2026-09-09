import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import type { MigrationParams } from 'umzug';

type Migration = (params: MigrationParams<QueryInterface>) => Promise<unknown>;

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('roles', {
    id: { type: DataTypes.STRING, primaryKey: true },
    client_application_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'client_applications', key: 'id' },
      onDelete: 'CASCADE',
    },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('roles');
};
