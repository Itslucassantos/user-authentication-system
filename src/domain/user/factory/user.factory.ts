import { v4 as uuid } from 'uuid';
import type Role from '../../role/entity/role.js';
import User from '../entity/user.js';
import type Email from '../value-object/email.js';

export default class UserFactory {
  static create(name: string, email: Email): User {
    return new User(uuid(), name, email);
  }

  static restore(props: {
    id: string;
    name: string;
    email: Email;
    passwordHash: string | null;
    active: boolean;
    roles: Role[];
  }): User {
    const user = new User(props.id, props.name, props.email);
    if (props.passwordHash) user.setPasswordHash(props.passwordHash);
    if (props.active) user.activate();
    user.setRoles(props.roles);

    return user;
  }
}
