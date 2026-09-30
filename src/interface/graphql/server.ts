import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import depthLimit from 'graphql-depth-limit';
import express, { type Express } from 'express';
import { corsAllowedOrigins, env } from '../../infrastructure/config/env.js';
import { createContext, type GraphQLContext } from './context.js';
import { formatGraphQLError } from './errors.js';
import { schema } from './schema/index.js';

export const GRAPHQL_PATH = '/graphql';

const MAX_QUERY_DEPTH = 10;

export async function mountGraphQL(app: Express): Promise<void> {
  const apolloServer = new ApolloServer<GraphQLContext>({
    schema,
    formatError: formatGraphQLError,
    includeStacktraceInErrorResponses: false,
    introspection: env.NODE_ENV !== 'production',
    validationRules: [depthLimit(MAX_QUERY_DEPTH)],
  });
  await apolloServer.start();

  app.use(
    GRAPHQL_PATH,
    cors({ origin: corsAllowedOrigins() }),
    express.json(),
    expressMiddleware(apolloServer, { context: createContext }),
  );
}
