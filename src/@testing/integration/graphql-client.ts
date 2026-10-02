import express from 'express';
import request from 'supertest';
import { mountGraphQL, GRAPHQL_PATH } from '../../interface/graphql/server.js';
import type { Tenant } from './tenant.js';

export interface GraphQLResponse<T = Record<string, any>> {
  data: T | null;
  errors?: Array<{ message: string; extensions?: { code?: string; [key: string]: unknown } }>;
}

export async function createGraphQLApp(): Promise<express.Express> {
  const app = express();
  await mountGraphQL(app);
  return app;
}

export async function gql<T = Record<string, any>>(
  app: express.Express,
  query: string,
  options: { variables?: Record<string, unknown>; token?: string; userAgent?: string } = {},
): Promise<GraphQLResponse<T>> {
  const req = request(app).post(GRAPHQL_PATH).set('Content-Type', 'application/json');
  if (options.token) req.set('Authorization', `Bearer ${options.token}`);
  if (options.userAgent) req.set('User-Agent', options.userAgent);
  const response = await req.send({ query, variables: options.variables });
  return response.body as GraphQLResponse<T>;
}

export const LOGIN_MUTATION = /* GraphQL */ `
  mutation Login($email: String!, $password: String!, $clientId: String!) {
    login(email: $email, password: $password, clientId: $clientId) {
      accessToken
      refreshToken
      user {
        id
        email
      }
    }
  }
`;

export async function login(
  app: express.Express,
  tenant: Pick<Tenant, 'clientId'>,
  email: string,
  password: string,
) {
  return gql(app, LOGIN_MUTATION, { variables: { email, password, clientId: tenant.clientId } });
}

/** Logs the tenant's admin in and returns its tokens. */
export async function loginAdmin(app: express.Express, tenant: Tenant) {
  const response = await login(app, tenant, tenant.admin.email, tenant.admin.password);
  const payload = response.data?.login as { accessToken: string; refreshToken: string };
  if (!payload) throw new Error(`Admin login failed: ${JSON.stringify(response.errors)}`);
  return payload;
}
