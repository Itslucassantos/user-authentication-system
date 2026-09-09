import {
  BelongsToMany,
  Column,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import RoleModel from '../../../role/repository/sequelize/role.model.js';
import RefreshTokenModel from '../../../auth/repository/sequelize/refresh-token.js';
import PasswordTokenModel from '../../../auth/repository/sequelize/password-token.js';
import UserRoleModel from './user-role.model.js';

@Table({
  tableName: 'users',
})
export default class UserModel extends Model {
  @PrimaryKey
  @Column
  declare id: string;

  @Column({ allowNull: false })
  declare name: string;

  @Column({ allowNull: false })
  declare email: string;

  @Column({ allowNull: false })
  declare passwordHash: string;

  @Column
  @Default(false)
  declare active: boolean;

  @BelongsToMany(() => RoleModel, () => UserRoleModel)
  declare roles: RoleModel[];

  @HasMany(() => RefreshTokenModel)
  declare refreshTokens: RefreshTokenModel[];

  @HasMany(() => PasswordTokenModel)
  declare passwordTokens: PasswordTokenModel[];

  @Column
  declare createdAt: Date;

  @Column
  declare updatedAt: Date;
}
