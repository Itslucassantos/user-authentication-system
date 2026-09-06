import {
  BelongsTo,
  Column,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import PermissionModel from './permission.model.js';
import ClientApplicationModel from '../../../client-application/repository/sequelize/client-application.model.js';

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

  @Column({ allowNull: true })
  declare description: string;

  @HasMany(() => PermissionModel)
  declare permissions: PermissionModel[];

  @Column
  declare createdAt: Date;

  @Column
  declare updatedAt: Date;
}
