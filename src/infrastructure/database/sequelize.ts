import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import { env } from '../config/env.js';
import UserModel from '../user/repository/sequelize/user.model.js';
import UserRoleModel from '../user/repository/sequelize/user-role.model.js';
import RoleModel from '../role/repository/sequelize/role.model.js';
import PermissionModel from '../role/repository/sequelize/permission.model.js';
import RolePermissionModel from '../role/repository/sequelize/role-permission.model.js';
import ClientApplicationModel from '../client-application/repository/sequelize/client-application.model.js';
import PasswordTokenModel from '../auth/repository/sequelize/password-token.model.js';

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
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
