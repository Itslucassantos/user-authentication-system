import type { PaginatedResult, PaginationParams } from './pagination.js';

export default interface RepositoryInterface<T> {
  findById(id: string): Promise<T | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<T>>;
  save(entity: T): Promise<void>;
  update(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}
