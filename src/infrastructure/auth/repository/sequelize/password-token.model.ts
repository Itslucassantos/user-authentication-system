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
import { PasswordTokenType } from '../../../../domain/auth/enum/password-token-type.enum.js';

@Table({
  tableName: 'password_tokens',
})
export default class PasswordTokenModel extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.STRING, allowNull: false })
  declare userId: string;

  @BelongsTo(() => UserModel)
  declare user: UserModel;

  @Column({
    type: DataType.ENUM(...Object.values(PasswordTokenType)),
    allowNull: false,
  })
  declare type: PasswordTokenType;

  @Column({ type: DataType.STRING, allowNull: false })
  declare tokenHash: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare used: boolean;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expiresAt: Date;

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;
}
