import type Permission from '../../../../domain/role/entity/permission.js';
import PermissionFactory from '../../../../domain/role/factory/permission.factory.js';
import type PermissionModel from './permission.model.js';

export default class PermissionMapper {
  static toDomain(model: PermissionModel): Permission {
    return PermissionFactory.restore(
      model.id,
      model.name,
      model.resource,
      model.action,
      model.description,
    );
  }
}
