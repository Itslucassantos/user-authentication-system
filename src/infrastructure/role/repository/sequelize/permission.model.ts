import { BelongsToMany, Column, Model, PrimaryKey, Table } from 'sequelize-typescript';
import RoleModel from './role.model.js';
import RolePermissionModel from './role-permission.model.js';

@Table({
  tableName: 'permissions',
})
export default class PermissionModel extends Model {
  @PrimaryKey
  @Column
  declare id: string;

  @Column({ allowNull: false })
  declare name: string;

  @Column({ allowNull: false })
  declare resource: string;

  @Column({ allowNull: false })
  declare action: string;

  @Column
  declare description: string;

  @BelongsToMany(() => RoleModel, () => RolePermissionModel)
  declare roles: RoleModel[];

  @Column
  declare createdAt: Date;

  @Column
  declare updatedAt: Date;
}
