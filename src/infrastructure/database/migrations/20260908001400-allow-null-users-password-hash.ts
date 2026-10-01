import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import type { MigrationParams } from 'umzug';

type Migration = (params: MigrationParams<QueryInterface>) => Promise<unknown>;

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.changeColumn('users', 'passwordHash', {
    type: DataTypes.STRING,
    allowNull: true,
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.changeColumn('users', 'passwordHash', {
    type: DataTypes.STRING,
    allowNull: false,
  });
};
