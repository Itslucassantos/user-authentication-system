import type { PaginationParams, PaginatedResult } from "../../../../domain/@shared/repository/pagination.js";
import type PasswordToken from "../../../../domain/auth/entity/password-token.js";
import type PasswordTokenRepositoryInterface from "../../../../domain/auth/repository/password-token-repository.interface.js";
import PasswordTokenNotFoundError from "../../../../domain/auth/error/password-token-not-found-error.js";
import RepositoryError from "../../../../domain/@shared/error/repository-error.js";
import PasswordTokenModel from "./password-token.model.js";
import PasswordTokenMapper from "./password-token.mapper.js";
import PasswordTokenFactory from "../../../../domain/auth/factory/password-token.factory.js";

export default class PasswordTokenRepository implements PasswordTokenRepositoryInterface {
    async findById(id: string): Promise<PasswordToken | null> {
        const model = await PasswordTokenModel.findByPk(id, { rejectOnEmpty: false });
        if (!model) {
            return null;
        }
        return this.toDomain(model);
    }

    async findByTokenHash(tokenHash: string): Promise<PasswordToken | null> {
        const model = await PasswordTokenModel.findOne({ where: { tokenHash } });
        if (!model) {
            return null;
        }
        return this.toDomain(model);
    }

    async findAll({ page, limit }: PaginationParams): Promise<PaginatedResult<PasswordToken>> {
        const { rows, count } = await PasswordTokenModel.findAndCountAll({
            limit,
            offset: (page - 1) * limit,
            order: [['createdAt', 'DESC']],
        });

        return {
            items: rows.map((model) => this.toDomain(model)),
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        };
    }

    private toDomain(model: PasswordTokenModel): PasswordToken {
        return PasswordTokenFactory.restore(
            model.id,
            model.userId,
            model.type,
            model.tokenHash,
            model.expiresAt,
            model.used,
        );
    }

    async save(entity: PasswordToken): Promise<void> {
        try {
            await PasswordTokenModel.create(PasswordTokenMapper.toPersistence(entity));
        } catch (error) {
            throw new RepositoryError('Failed to save password token', error);
        }
    }

    async update(entity: PasswordToken): Promise<void> {
        try {
            const [affectedCount] = await PasswordTokenModel.update(PasswordTokenMapper.toPersistence(entity), {
                where: { id: entity.id },
            });
            if (affectedCount === 0) {
                throw new PasswordTokenNotFoundError(entity.id);
            }
        } catch (error) {
            if (error instanceof PasswordTokenNotFoundError) {
                throw error;
            }
            throw new RepositoryError('Failed to update password token', error);
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const deletedCount = await PasswordTokenModel.destroy({ where: { id } });
            if (deletedCount === 0) {
                throw new PasswordTokenNotFoundError(id);
            }
        } catch (error) {
            if (error instanceof PasswordTokenNotFoundError) {
                throw error;
            }
            throw new RepositoryError('Failed to delete password token', error);
        }
    }
}
