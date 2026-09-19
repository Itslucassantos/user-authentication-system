import type { QueryInterface } from 'sequelize';
import type { MigrationParams } from 'umzug';

type Migration = (params: MigrationParams<QueryInterface>) => Promise<unknown>;

const CONSTRAINT_NAME = 'client_applications_name_unique';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addConstraint('client_applications', {
    fields: ['name'],
    type: 'unique',
    name: CONSTRAINT_NAME,
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeConstraint('client_applications', CONSTRAINT_NAME);
};
