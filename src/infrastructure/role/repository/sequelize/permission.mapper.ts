import type Permission from '../../../../domain/role/entity/permission.js';
import PermissionFactory from '../../../../domain/role/factory/permission.factory.js';
import type PermissionModel from './permission.model.js';

export default class PermissionMapper {
  static toPersistence(entity: Permission) {
    return {
      id: entity.id,
      clientApplicationId: entity.clientApplicationId,
      name: entity.name,
      resource: entity.resource,
      action: entity.action,
      description: entity.description,
    };
  }

  static toDomain(model: PermissionModel): Permission {
    return PermissionFactory.restore(
      model.id,
      model.clientApplicationId,
      model.name,
      model.resource,
      model.action,
      model.description,
    );
  }
}
