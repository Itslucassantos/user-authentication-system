import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import express, { type Express } from 'express';
import { createContext, type GraphQLContext } from './context.js';
import { formatGraphQLError } from './errors.js';
import { schema } from './schema/index.js';

export const GRAPHQL_PATH = '/graphql';

export async function mountGraphQL(app: Express): Promise<void> {
  const apolloServer = new ApolloServer<GraphQLContext>({
    schema,
    formatError: formatGraphQLError,
    includeStacktraceInErrorResponses: false,
  });
  await apolloServer.start();

  app.use(
    GRAPHQL_PATH,
    cors(),
    express.json(),
    expressMiddleware(apolloServer, { context: createContext }),
  );
}
