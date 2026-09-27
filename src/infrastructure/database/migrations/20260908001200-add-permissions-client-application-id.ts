import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import type { MigrationParams } from 'umzug';

type Migration = (params: MigrationParams<QueryInterface>) => Promise<unknown>;

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addColumn('permissions', 'client_application_id', {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'client_applications', key: 'id' },
    onDelete: 'CASCADE',
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn('permissions', 'client_application_id');
};
