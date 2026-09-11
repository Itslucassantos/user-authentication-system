import { BelongsToMany, Column, DataType, Model, PrimaryKey, Table } from 'sequelize-typescript';
import RoleModel from './role.model.js';
import RolePermissionModel from './role-permission.model.js';

@Table({
  tableName: 'permissions',
})
export default class PermissionModel extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare resource: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare action: string;

  @Column(DataType.STRING)
  declare description: string;

  @BelongsToMany(() => RoleModel, () => RolePermissionModel)
  declare roles: RoleModel[];

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
