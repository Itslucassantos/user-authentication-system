import { UniqueConstraintError } from 'sequelize';
import RepositoryError from '../../../../domain/@shared/error/repository-error.js';
import type {
  PaginationParams,
  PaginatedResult,
} from '../../../../domain/@shared/repository/pagination.js';
import type ClientApplication from '../../../../domain/client-application/entity/client-application.js';
import type ClientApplicationRepositoryInterface from '../../../../domain/client-application/repository/client-application-repository.interface.js';
import ClientApplicationMapper from './client-application.mapper.js';
import ClientApplicationModel from './client-application.model.js';
import ClientApplicationAlreadyExistsError from '../../../../domain/client-application/error/client-application-already-exists-error.js';
import RoleMapper from '../../../role/repository/sequelize/role.mapper.js';
import ClientApplicationFactory from '../../../../domain/client-application/factory/client-application.factory.js';
import RoleModel from '../../../role/repository/sequelize/role.model.js';
import PermissionModel from '../../../role/repository/sequelize/permission.model.js';
import ClientApplicationNotFoundError from '../../../../domain/client-application/error/client-application-not-found-error.js';

const ROLES_INCLUDE = [{ model: RoleModel, include: [PermissionModel] }];

export default class ClientApplicationRepository implements ClientApplicationRepositoryInterface {
  async findById(id: string): Promise<ClientApplication | null> {
    const model = await ClientApplicationModel.findByPk(id, {
      rejectOnEmpty: false,
      include: ROLES_INCLUDE,
    });
    if (!model) {
      return null;
    }

    return this.toDomain(model);
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<ClientApplication>> {
    const { rows, count } = await ClientApplicationModel.findAndCountAll({
      limit: params.limit,
      offset: (params.page - 1) * params.limit,
      order: [['createdAt', 'DESC']],
      include: ROLES_INCLUDE,
      distinct: true,
    });

    return {
      items: rows.map((model) => this.toDomain(model)),
      total: count,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(count / params.limit),
    };
  }

  private toDomain(model: ClientApplicationModel): ClientApplication {
    return ClientApplicationFactory.restore(
      model.id,
      model.name,
      model.clientId,
      model.clientSecretHash,
      model.redirectUris,
      (model.roles ?? []).map((role) => RoleMapper.toDomain(role)),
    );
  }

  async save(entity: ClientApplication): Promise<void> {
    try {
      await ClientApplicationModel.create(ClientApplicationMapper.toPersistence(entity));
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ClientApplicationAlreadyExistsError(entity.name);
      }
      throw new RepositoryError('Failed to save client application', error);
    }
  }

  async update(entity: ClientApplication): Promise<void> {
    try {
      const [updatedCount] = await ClientApplicationModel.update(
        ClientApplicationMapper.toPersistence(entity),
        { where: { id: entity.id } },
      );
      if (updatedCount === 0) {
        throw new ClientApplicationNotFoundError(entity.id);
      }
    } catch (error) {
      if (error instanceof ClientApplicationNotFoundError) {
        throw error;
      }
      if (error instanceof UniqueConstraintError) {
        throw new ClientApplicationAlreadyExistsError(entity.name);
      }
      throw new RepositoryError('Failed to update client application', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const deletedCount = await ClientApplicationModel.destroy({ where: { id } });
      if (deletedCount === 0) {
        throw new ClientApplicationNotFoundError(id);
      }
    } catch (error) {
      if (error instanceof ClientApplicationNotFoundError) {
        throw error;
      }
      throw new RepositoryError('Failed to delete client application', error);
    }
  }
}
