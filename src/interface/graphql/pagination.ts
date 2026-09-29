import type { PaginatedResult } from '../../domain/@shared/repository/pagination.js';

export interface Connection<T> {
  items: T[];
  pageInfo: { total: number; page: number; limit: number; totalPages: number };
}

export function toConnection<T>(result: PaginatedResult<T>): Connection<T> {
  const { items, ...pageInfo } = result;
  return { items, pageInfo };
}
