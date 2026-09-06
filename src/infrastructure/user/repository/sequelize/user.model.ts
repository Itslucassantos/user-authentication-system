import { Column, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import RoleModel from '../../../role/repository/sequelize/role.model.js';

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

  @HasMany(() => RoleModel)
  declare roles: RoleModel[];

  @Column
  declare createdAt: Date;

  @Column
  declare updatedAt: Date;
}
