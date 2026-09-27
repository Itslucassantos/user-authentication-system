import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import ClientApplicationModel from '../../../client-application/repository/sequelize/client-application.model.js';
import RoleModel from './role.model.js';
import RolePermissionModel from './role-permission.model.js';

@Table({
  tableName: 'permissions',
})
export default class PermissionModel extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @ForeignKey(() => ClientApplicationModel)
  @Column({ type: DataType.STRING, allowNull: false, field: 'client_application_id' })
  declare clientApplicationId: string;

  @BelongsTo(() => ClientApplicationModel)
  declare clientApplication: ClientApplicationModel;

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
