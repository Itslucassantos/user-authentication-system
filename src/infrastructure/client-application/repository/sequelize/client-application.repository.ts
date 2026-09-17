import { UniqueConstraintError } from "sequelize";
import RepositoryError from "../../../../domain/@shared/error/repository-error.js";
import type { PaginationParams, PaginatedResult } from "../../../../domain/@shared/repository/pagination.js";
import type ClientApplication from "../../../../domain/client-application/entity/client-application.js";
import type ClientApplicationRepositoryInterface from "../../../../domain/client-application/repository/client-application-repository.interface.js";
import ClientApplicationMapper from "./client-application.mapper.js";
import ClientApplicationModel from "./client-application.model.js";
import ClientApplicationAlreadyExistsError from "../../../../domain/client-application/error/client-application-already-exists-error.js";

export default class ClientApplicationRepository implements ClientApplicationRepositoryInterface {
    async findById(id: string): Promise<ClientApplication | null> {
        throw new Error("Method not implemented.");
    }
    async findAll(params: PaginationParams): Promise<PaginatedResult<ClientApplication>> {
        throw new Error("Method not implemented.");
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
        throw new Error("Method not implemented.");
    }
    async delete(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}