import { ForeignKeyConstraintError } from 'sequelize';
import RepositoryError from '../../../../domain/@shared/error/repository-error.js';
import type {
  PaginationParams,
  PaginatedResult,
} from '../../../../domain/@shared/repository/pagination.js';
import type Permission from '../../../../domain/role/entity/permission.js';
import PermissionInUseError from '../../../../domain/role/error/permission-in-use-error.js';
import PermissionNotFoundError from '../../../../domain/role/error/permission-not-found-error.js';
import type PermissionRepositoryInterface from '../../../../domain/role/repository/permission-repository.interface.js';
import PermissionMapper from './permission.mapper.js';
import PermissionModel from './permission.model.js';
import RolePermissionModel from './role-permission.model.js';

export default class PermissionRepository implements PermissionRepositoryInterface {
  async findById(id: string): Promise<Permission | null> {
    const model = await PermissionModel.findByPk(id, { rejectOnEmpty: false });
    if (!model) {
      return null;
    }
    return PermissionMapper.toDomain(model);
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    const models = await PermissionModel.findAll({
      where: {
        id: ids,
      },
    });

    return models.map((model) => PermissionMapper.toDomain(model));
  }

  async isInUse(id: string): Promise<boolean> {
    const count = await RolePermissionModel.count({ where: { permissionId: id } });
    return count > 0;
  }

  async findAll({ page, limit }: PaginationParams): Promise<PaginatedResult<Permission>> {
    const { rows, count } = await PermissionModel.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });

    return {
      items: rows.map((model) => PermissionMapper.toDomain(model)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  async save(entity: Permission): Promise<void> {
    try {
      await PermissionModel.create(PermissionMapper.toPersistence(entity));
    } catch (error) {
      throw new RepositoryError('Failed to save permission', error);
    }
  }

  async update(entity: Permission): Promise<void> {
    try {
      const [affectedCount] = await PermissionModel.update(PermissionMapper.toPersistence(entity), {
        where: { id: entity.id },
      });
      if (affectedCount === 0) {
        throw new PermissionNotFoundError(entity.id);
      }
    } catch (error) {
      if (error instanceof PermissionNotFoundError) {
        throw error;
      }
      throw new RepositoryError('Failed to update permission', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const deletedCount = await PermissionModel.destroy({ where: { id } });
      if (deletedCount === 0) {
        throw new PermissionNotFoundError(id);
      }
    } catch (error) {
      if (error instanceof PermissionNotFoundError) {
        throw error;
      }
      if (error instanceof ForeignKeyConstraintError) {
        throw new PermissionInUseError(id);
      }
      throw new RepositoryError('Failed to delete permission', error);
    }
  }
}
