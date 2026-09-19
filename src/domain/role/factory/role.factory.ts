import { v4 as uuid } from 'uuid';
import type Permission from '../entity/permission.js';
import Role from '../entity/role.js';

export default class RoleFactory {
  static create(
    clientApplicationId: string,
    name: string,
    description: string,
    permissions: Permission[],
  ): Role {
    return new Role(uuid(), clientApplicationId, name, description, permissions);
  }

  static restore(
    id: string,
    clientApplicationId: string,
    name: string,
    description: string,
    permissions: Permission[],
  ): Role {
    return new Role(id, clientApplicationId, name, description, permissions);
  }
}
