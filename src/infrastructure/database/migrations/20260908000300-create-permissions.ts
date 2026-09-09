import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import type { MigrationParams } from 'umzug';

type Migration = (params: MigrationParams<QueryInterface>) => Promise<unknown>;

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('permissions', {
    id: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    resource: { type: DataTypes.STRING, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('permissions');
};
