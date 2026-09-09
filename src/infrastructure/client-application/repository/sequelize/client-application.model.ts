import { Column, DataType, Default, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import RoleModel from '../../../role/repository/sequelize/role.model.js';
import RefreshTokenModel from '../../../auth/repository/sequelize/refresh-token.js';

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

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
  })
  declare redirectUris: string[];

  @Column
  @Default(true)
  declare active: boolean;

  @HasMany(() => RoleModel)
  declare roles: RoleModel[];

  @HasMany(() => RefreshTokenModel)
  declare refreshTokens: RefreshTokenModel[];

  @Column
  declare createdAt: Date;

  @Column
  declare updatedAt: Date;
}
