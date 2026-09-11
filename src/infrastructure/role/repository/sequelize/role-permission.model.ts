import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import PermissionModel from './permission.model.js';
import RoleModel from './role.model.js';

@Table({
  tableName: 'role_permissions',
  timestamps: false,
})
export default class RolePermissionModel extends Model {
  @PrimaryKey
  @ForeignKey(() => RoleModel)
  @Column({ type: DataType.STRING, field: 'role_id' })
  declare roleId: string;

  @PrimaryKey
  @ForeignKey(() => PermissionModel)
  @Column({ type: DataType.STRING, field: 'permission_id' })
  declare permissionId: string;

  @BelongsTo(() => RoleModel)
  declare role: RoleModel;

  @BelongsTo(() => PermissionModel)
  declare permission: PermissionModel;
}
