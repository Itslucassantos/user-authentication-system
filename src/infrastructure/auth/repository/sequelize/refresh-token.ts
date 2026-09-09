import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import UserModel from '../../../user/repository/sequelize/user.model.js';
import ClientApplicationModel from '../../../client-application/repository/sequelize/client-application.model.js';

@Table({
  tableName: 'refresh_tokens',
})
export default class RefreshToken extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.STRING, allowNull: false })
  declare userId: string;

  @BelongsTo(() => UserModel)
  declare user: UserModel;

  @ForeignKey(() => ClientApplicationModel)
  @Column({ type: DataType.STRING, allowNull: false })
  declare clientApplicationId: string;

  @BelongsTo(() => ClientApplicationModel)
  declare clientApplication: ClientApplicationModel;

  @Column({ type: DataType.STRING, allowNull: false })
  declare tokenHash: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare deviceInfo: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare revoked: boolean;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expiresAt: Date;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
