import type { QueryInterface } from 'sequelize';
import { DataTypes } from 'sequelize';
import type { MigrationParams } from 'umzug';

type Migration = (params: MigrationParams<QueryInterface>) => Promise<unknown>;

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('password_tokens', {
    id: { type: DataTypes.STRING, primaryKey: true },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('INVITATION', 'PASSWORD_RESET'),
      allowNull: false,
    },
    tokenHash: { type: DataTypes.STRING, allowNull: false },
    used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('password_tokens', {});
};
