import { Model, PrimaryKey, Table, Column } from 'sequelize-typescript';

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

  @Column
  declare createdAt: Date;

  @Column
  declare updatedAt: Date;
}
