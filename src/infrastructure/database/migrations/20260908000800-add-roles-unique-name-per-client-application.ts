import type { QueryInterface } from 'sequelize';
import type { MigrationParams } from 'umzug';

type Migration = (params: MigrationParams<QueryInterface>) => Promise<unknown>;

const CONSTRAINT_NAME = 'roles_client_application_id_name_unique';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addConstraint('roles', {
    fields: ['client_application_id', 'name'],
    type: 'unique',
    name: CONSTRAINT_NAME,
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeConstraint('roles', CONSTRAINT_NAME);
};
