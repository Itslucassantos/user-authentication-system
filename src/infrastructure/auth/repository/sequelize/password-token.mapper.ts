import type PasswordToken from "../../../../domain/auth/entity/password-token.js";
import PasswordTokenFactory from "../../../../domain/auth/factory/password-token.factory.js";
import type PasswordTokenModel from "./password-token.model.js";

export default class PasswordTokenMapper {
    static toPersistence(entity: PasswordToken) {
        return {
            id: entity.id,
            userId: entity.userId,
            type: entity.type,
            tokenHash: entity.tokenHash,
            used: entity.used,
            expiresAt: entity.expiresAt,
        };
    }

    static toDomain(model: PasswordTokenModel): PasswordToken {
        return PasswordTokenFactory.restore(
            model.id,
            model.userId,
            model.type,
            model.tokenHash,
            model.expiresAt,
            model.used,
        );
    }
}
