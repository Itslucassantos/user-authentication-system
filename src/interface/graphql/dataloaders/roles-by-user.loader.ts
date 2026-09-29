import DataLoader from 'dataloader';
import { repositories } from '../../../container/index.js';
import type Role from '../../../domain/role/entity/role.js';

export function createRolesByUserLoader(): DataLoader<string, Role[]> {
  return new DataLoader<string, Role[]>(async (userIds) => {
    const users = await Promise.all(userIds.map((id) => repositories.user.findById(id)));
    return users.map((user) => user?.roles ?? []);
  });
}
