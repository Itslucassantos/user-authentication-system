import { Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import RoleModel from '../../../role/repository/sequelize/role.model.js';

@Table({
  tableName: 'client_applications',
})
export default class ClientApplicationModel extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare clientId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare clientSecretHash: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
  })
  declare redirectUris: string[];

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare active: boolean;

  @HasMany(() => RoleModel)
  declare roles: RoleModel[];

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
