import type { PaginationParams, PaginatedResult } from "../../../../domain/@shared/repository/pagination.js";
import type Role from "../../../../domain/role/entity/role.js";
import type RoleRepositoryInterface from "../../../../domain/role/repository/role-repository.interface.js";

export default class RoleRepository implements RoleRepositoryInterface {
    findById(id: string): Promise<Role | null> {
        throw new Error("Method not implemented.");
    }
    findAll(params: PaginationParams): Promise<PaginatedResult<Role>> {
        throw new Error("Method not implemented.");
    }
    save(entity: Role): Promise<void> {
        throw new Error("Method not implemented.");
    }
    update(entity: Role): Promise<void> {
        throw new Error("Method not implemented.");
    }
    delete(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}