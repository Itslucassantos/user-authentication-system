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
export default class PasswordToken extends Model {
  @PrimaryKey
  @Column
  declare id: string;

  @ForeignKey(() => UserModel)
  @Column({ allowNull: false })
  declare userId: string;

  @BelongsTo(() => UserModel)
  declare user: UserModel;

  @Column({
    type: DataType.ENUM(...Object.values(PasswordTokenType)),
    allowNull: false,
  })
  declare type: PasswordTokenType;

  @Column({ allowNull: false })
  declare tokenHash: string;

  @Column({ allowNull: false, defaultValue: false })
  declare used: boolean;

  @Column({ allowNull: false })
  declare expiresAt: Date;

  @Column
  declare createdAt: Date;

  @Column
  declare updatedAt: Date;
}
