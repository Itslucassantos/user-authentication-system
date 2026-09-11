import { UniqueConstraintError } from 'sequelize';
import type User from '../../../../domain/user/entity/user.js';
import type UserRepositoryInterface from '../../../../domain/user/repository/user-repository.interface.js';
import RepositoryError from '../../../../domain/@shared/error/repository-error.js';
import UserAlreadyExistsError from '../../../../domain/user/error/user-already-exists-error.js';
import { sequelize } from '../../../database/sequelize.js';
import UserModel from './user.model.js';
import UserMapper from './user.mapper.js';

export default class UserRepository implements UserRepositoryInterface {
    findById(id: string): Promise<User | null> {
        throw new Error("Method not implemented.");
    }
    findAll(): Promise<User[]> {
        throw new Error("Method not implemented.");
    }
    async save(entity: User): Promise<void> {
        try {
            await UserModel.create(UserMapper.toPersistence(entity));
        } catch (error) {
            if (error instanceof UniqueConstraintError) {
                throw new UserAlreadyExistsError(entity.email.value);
            }
            throw new RepositoryError('Failed to save user', error);
        }
    }
    async update(entity: User): Promise<void> {
        try {
            await sequelize.transaction(async (transaction) => {
                const [affectedCount] = await UserModel.update(UserMapper.toPersistence(entity), {
                    where: { id: entity.id },
                    transaction,
                });
                if (affectedCount === 0) {
                    throw new Error(`User with id "${entity.id}" not found`);
                }
                const model = await UserModel.findByPk(entity.id, { transaction, rejectOnEmpty: true });
                await model.$set(
                    'roles',
                    entity.roles.map((role) => role.id),
                    { transaction },
                );
            });
        } catch (error) {
            if (error instanceof UniqueConstraintError) {
                throw new UserAlreadyExistsError(entity.email.value);
            }
            throw new RepositoryError('Failed to update user', error);
        }
    }
    delete(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
