import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import RoleModel from '../../../role/repository/sequelize/role.model.js';
import ClientApplicationModel from '../../../client-application/repository/sequelize/client-application.model.js';
import UserModel from './user.model.js';

@Table({
  tableName: 'user_roles',
  timestamps: false,
})
export default class UserRoleModel extends Model {
  @PrimaryKey
  @ForeignKey(() => UserModel)
  @Column({ type: DataType.STRING, field: 'user_id' })
  declare userId: string;

  @PrimaryKey
  @ForeignKey(() => RoleModel)
  @Column({ type: DataType.STRING, field: 'role_id' })
  declare roleId: string;

  @ForeignKey(() => ClientApplicationModel)
  @Column({ type: DataType.STRING, allowNull: false, field: 'client_application_id' })
  declare clientApplicationId: string;

  @BelongsTo(() => UserModel)
  declare user: UserModel;

  @BelongsTo(() => RoleModel)
  declare role: RoleModel;

  @BelongsTo(() => ClientApplicationModel)
  declare clientApplication: ClientApplicationModel;
}
