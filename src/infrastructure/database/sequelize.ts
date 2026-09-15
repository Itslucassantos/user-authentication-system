import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import UserModel from '../user/repository/sequelize/user.model.js';
import UserRoleModel from '../user/repository/sequelize/user-role.model.js';
import RoleModel from '../role/repository/sequelize/role.model.js';
import PermissionModel from '../role/repository/sequelize/permission.model.js';
import RolePermissionModel from '../role/repository/sequelize/role-permission.model.js';
import ClientApplicationModel from '../client-application/repository/sequelize/client-application.model.js';
import PasswordTokenModel from '../auth/repository/sequelize/password-token.js';

try {
  process.loadEnvFile();
} catch {
  // .env ausente — segue com process.env
}

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB ?? 'auth_db',
  username: process.env.POSTGRES_USER ?? 'auth_user',
  password: process.env.POSTGRES_PASSWORD ?? '',
  logging: false,
  models: [
    UserModel,
    UserRoleModel,
    RoleModel,
    PermissionModel,
    RolePermissionModel,
    ClientApplicationModel,
    PasswordTokenModel,
  ],
});
