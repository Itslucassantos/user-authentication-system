import User from '../../../../domain/user/entity/user.js';

export default class UserMapper {
  static toPersistence(entity: User) {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email.value,
      passwordHash: entity.passwordHash,
      active: entity.active,
    };
  }
}
