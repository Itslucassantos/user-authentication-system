import DataLoader from 'dataloader';
import { repositories } from '../../../container/index.js';
import type Role from '../../../domain/role/entity/role.js';

export function createRolesByUserLoader(): DataLoader<string, Role[]> {
  return new DataLoader<string, Role[]>(async (userIds) => {
    const users = await repositories.user.findByIds([...userIds]);
    const rolesByUserId = new Map(users.map((user) => [user.id, user.roles]));
    return userIds.map((id) => rolesByUserId.get(id) ?? []);
  });
}
