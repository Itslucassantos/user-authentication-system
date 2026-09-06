import { Column, Default, HasMany, Model, Table, PrimaryKey } from 'sequelize-typescript';
import RoleModel from '../../../role/repository/sequelize/role.model.js';

@Table({
  tableName: 'client_applications',
})
export default class ClientApplicationModel extends Model {
  @PrimaryKey
  @Column
  declare id: string;

  @Column({ allowNull: false })
  declare name: string;

  @Column({ allowNull: false })
  declare clientId: string;

  @Column({ allowNull: false })
  declare clientSecretHash: string;

  @Column({ allowNull: false })
  declare redirectUris: string[];

  @Column
  @Default(true)
  declare active: boolean;

  @HasMany(() => RoleModel)
  declare roles: RoleModel[];

  @Column
  declare createdAt: Date;

  @Column
  declare updatedAt: Date;
}
