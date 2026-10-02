import { connectInfrastructure, disconnectInfrastructure, resetState } from './database.js';

/** Standard hooks: connect once per file, start every test from empty PostgreSQL and Redis. */
export function useIntegrationInfrastructure(): void {
  beforeAll(connectInfrastructure);
  afterAll(disconnectInfrastructure);
  beforeEach(resetState);
}
