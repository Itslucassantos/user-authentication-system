import { v4 as uuid } from 'uuid';
import Permission from '../entity/permission.js';

export default class PermissionFactory {
  static create(
    clientApplicationId: string,
    name: string,
    resource: string,
    action: string,
    description?: string,
  ) {
    return new Permission(uuid(), clientApplicationId, name, resource, action, description);
  }

  static restore(
    id: string,
    clientApplicationId: string,
    name: string,
    resource: string,
    action: string,
    description?: string,
  ) {
    return new Permission(id, clientApplicationId, name, resource, action, description);
  }
}
