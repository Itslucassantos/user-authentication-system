import type { QueryInterface } from 'sequelize';
import type { MigrationParams } from 'umzug';

type Migration = (params: MigrationParams<QueryInterface>) => Promise<unknown>;

const CONSTRAINT_NAME = 'permissions_client_application_id_resource_action_unique';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addConstraint('permissions', {
    fields: ['client_application_id', 'resource', 'action'],
    type: 'unique',
    name: CONSTRAINT_NAME,
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeConstraint('permissions', CONSTRAINT_NAME);
};
