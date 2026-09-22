import type {
  PaginationParams,
  PaginatedResult,
} from '../../../../domain/@shared/repository/pagination.js';
import type Role from '../../../../domain/role/entity/role.js';
import type RoleRepositoryInterface from '../../../../domain/role/repository/role-repository.interface.js';
import RoleModel from './role.model.js';
import RoleAlreadyExistsError from '../../../../domain/role/error/role-already-exists-error.js';
import RoleNotFoundError from '../../../../domain/role/error/role-not-found-error.js';
import { UniqueConstraintError } from 'sequelize';
import RepositoryError from '../../../../domain/@shared/error/repository-error.js';
import RoleMapper from './role.mapper.js';
import { sequelize } from '../../../database/sequelize.js';
import RoleFactory from '../../../../domain/role/factory/role.factory.js';
import PermissionMapper from './permission.mapper.js';
import PermissionModel from './permission.model.js';

const PERMISSIONS_INCLUDE = [PermissionModel];

export default class RoleRepository implements RoleRepositoryInterface {
  async findByIds(ids: string[]): Promise<Role[]> {
    const models = await RoleModel.findAll({
      where: {
        id: ids,
      },
      include: PERMISSIONS_INCLUDE,
    });
    
    return models.map((model) => this.toDomain(model));
  }
  
  async findById(id: string): Promise<Role | null> {
    const model = await RoleModel.findByPk(id, {
      rejectOnEmpty: false,
      include: PERMISSIONS_INCLUDE,
    });
    if (!model) {
      return null;
    }
    return this.toDomain(model);
  }

  async findAll({ page, limit }: PaginationParams): Promise<PaginatedResult<Role>> {
    const { rows, count } = await RoleModel.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
      include: PERMISSIONS_INCLUDE,
      distinct: true,
    });

    return {
      items: rows.map((model) => this.toDomain(model)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  private toDomain(model: RoleModel): Role {
    return RoleFactory.restore(
      model.id,
      model.clientApplicationId,
      model.name,
      model.description,
      (model.permissions ?? []).map((permission) => PermissionMapper.toDomain(permission)),
    );
  }

  async save(entity: Role): Promise<void> {
    try {
      await sequelize.transaction(async (transaction) => {
        const model = await RoleModel.create(RoleMapper.toPersistence(entity), { transaction });
        await model.$set(
          'permissions',
          entity.permissions.map((permission) => permission.id),
          { transaction },
        );
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new RoleAlreadyExistsError(entity.name);
      }
      throw new RepositoryError('Failed to save role', error);
    }
  }

  async update(entity: Role): Promise<void> {
    try {
      await sequelize.transaction(async (transaction) => {
        const model = await RoleModel.findByPk(entity.id, { transaction });
        if (!model) {
          throw new RoleNotFoundError(entity.id);
        }
        await model.update(RoleMapper.toPersistence(entity), { transaction });
        await model.$set(
          'permissions',
          entity.permissions.map((permission) => permission.id),
          { transaction },
        );
      });
    } catch (error) {
      if (error instanceof RoleNotFoundError) {
        throw error;
      }
      if (error instanceof UniqueConstraintError) {
        throw new RoleAlreadyExistsError(entity.name);
      }
      throw new RepositoryError('Failed to update role', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const deletedCount = await RoleModel.destroy({ where: { id } });
      if (deletedCount === 0) {
        throw new RoleNotFoundError(id);
      }
    } catch (error) {
      if (error instanceof RoleNotFoundError) {
        throw error;
      }
      throw new RepositoryError('Failed to delete role', error);
    }
  }
}
