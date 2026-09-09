import {
  BelongsToMany,
  Column,
  DataType,
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
  @Column(DataType.STRING)
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare passwordHash: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare active: boolean;

  @BelongsToMany(() => RoleModel, () => UserRoleModel)
  declare roles: RoleModel[];

  @HasMany(() => RefreshTokenModel)
  declare refreshTokens: RefreshTokenModel[];

  @HasMany(() => PasswordTokenModel)
  declare passwordTokens: PasswordTokenModel[];

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
