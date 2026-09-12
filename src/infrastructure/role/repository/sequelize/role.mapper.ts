import type Role from "../../../../domain/role/entity/role.js";
import RoleFactory from "../../../../domain/role/factory/role.factory.js";
import PermissionMapper from "./permission.mapper.js";
import type RoleModel from "./role.model.js";

export default class RoleMapper {
    static toPersistence(entity: Role) {
        return {
            id: entity.id,
            clientApplicationId: entity.clientApplicationId,
            name: entity.name,
            description: entity.description,
            permissions: entity.permissions,
        };
    }

    static toDomain(model: RoleModel): Role {
        return RoleFactory.restore(
            model.id,
            model.clientApplicationId,
            model.name,
            model.description,
            (model.permissions ?? []).map((permission) => PermissionMapper.toDomain(permission)),
        );
    }
}