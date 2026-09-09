import { BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import UserModel from '../../../user/repository/sequelize/user.model.js';
import ClientApplicationModel from '../../../client-application/repository/sequelize/client-application.model.js';

@Table({
  tableName: 'refresh_tokens',
})
export default class RefreshToken extends Model {
  @PrimaryKey
  @Column
  declare id: string;

  @ForeignKey(() => UserModel)
  @Column({ allowNull: false })
  declare userId: string;

  @BelongsTo(() => UserModel)
  declare user: UserModel;

  @ForeignKey(() => ClientApplicationModel)
  @Column({ allowNull: false })
  declare clientApplicationId: string;

  @BelongsTo(() => ClientApplicationModel)
  declare clientApplication: ClientApplicationModel;

  @Column({ allowNull: false })
  declare tokenHash: string;

  @Column({ allowNull: false })
  declare deviceInfo: string;

  @Column({ allowNull: false, defaultValue: false })
  declare revoked: boolean;

  @Column({ allowNull: false })
  declare expiresAt: Date;

  @Column
  declare createdAt: Date;

  @Column
  declare updatedAt: Date;
}
