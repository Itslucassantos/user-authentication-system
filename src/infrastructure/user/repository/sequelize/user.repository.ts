import { UniqueConstraintError } from 'sequelize';
import type User from '../../../../domain/user/entity/user.js';
import type UserRepositoryInterface from '../../../../domain/user/repository/user-repository.interface.js';
import type { PaginatedResult, PaginationParams } from '../../../../domain/@shared/repository/pagination.js';
import RepositoryError from '../../../../domain/@shared/error/repository-error.js';
import UserAlreadyExistsError from '../../../../domain/user/error/user-already-exists-error.js';
import Email from '../../../../domain/user/value-object/email.js';
import { sequelize } from '../../../database/sequelize.js';
import UserModel from './user.model.js';
import UserMapper from './user.mapper.js';
import UserFactory from '../../../../domain/user/factory/user.factory.js';
import RoleModel from '../../../role/repository/sequelize/role.model.js';
import PermissionModel from '../../../role/repository/sequelize/permission.model.js';
import RoleMapper from '../../../role/repository/sequelize/role.mapper.js';

const ROLES_INCLUDE = [{ model: RoleModel, include: [PermissionModel] }];

export default class UserRepository implements UserRepositoryInterface {
    async findById(id: string): Promise<User | null> {
        const model = await UserModel.findByPk(id, { rejectOnEmpty: false, include: ROLES_INCLUDE });
        if (!model) {
            return null;
        }

        return this.toDomainEntity(model);
    }
    async findAll({ page, limit }: PaginationParams): Promise<PaginatedResult<User>> {
        const { rows, count } = await UserModel.findAndCountAll({
            limit,
            offset: (page - 1) * limit,
            order: [['createdAt', 'DESC']],
            include: ROLES_INCLUDE,
            distinct: true,
        });

        return {
            items: rows.map((model) => this.toDomainEntity(model)),
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        };
    }
    private toDomainEntity(model: UserModel): User {
        return UserFactory.restore({
            id: model.id,
            name: model.name,
            email: new Email(model.email),
            passwordHash: model.passwordHash,
            active: model.active,
            roles: (model.roles ?? []).map((role) => RoleMapper.toDomain(role)),
        });
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
    async delete(id: string): Promise<void> {
        try {
            const deletedCount = await UserModel.destroy({ where: { id } });
            if (deletedCount === 0) {
                throw new Error(`User with id "${id}" not found`);
            }
        } catch (error) {
            throw new RepositoryError('Failed to delete user', error);
        }
    }
}
