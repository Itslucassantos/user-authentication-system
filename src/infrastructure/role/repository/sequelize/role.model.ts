import {
  BelongsTo,
  BelongsToMany,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import PermissionModel from './permission.model.js';
import ClientApplicationModel from '../../../client-application/repository/sequelize/client-application.model.js';
import UserModel from '../../../user/repository/sequelize/user.model.js';
import RolePermissionModel from './role-permission.model.js';
import UserRoleModel from '../../../user/repository/sequelize/user-role.model.js';

@Table({
  tableName: 'roles',
})
export default class RoleModel extends Model {
  @PrimaryKey
  @Column
  declare id: string;

  @ForeignKey(() => ClientApplicationModel)
  @Column({ allowNull: false, field: 'client_application_id' })
  declare clientApplicationId: string;

  @BelongsTo(() => ClientApplicationModel)
  declare clientApplication: ClientApplicationModel;

  @Column({ allowNull: false })
  declare name: string;

  @Column({ allowNull: false })
  declare description: string;

  @BelongsToMany(() => PermissionModel, () => RolePermissionModel)
  declare permissions: PermissionModel[];

  @BelongsToMany(() => UserModel, () => UserRoleModel)
  declare users: UserModel[];

  @Column
  declare createdAt: Date;

  @Column
  declare updatedAt: Date;
}
