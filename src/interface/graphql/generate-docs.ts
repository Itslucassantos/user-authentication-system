import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { getIntrospectionQuery, graphqlSync } from 'graphql';
import { printSchemaWithDirectives } from '@graphql-tools/utils';
import { renderSchema } from 'graphql-markdown';
import { schema } from './schema/index.js';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = join(rootDir, 'docs', 'api');
mkdirSync(outDir, { recursive: true });

writeFileSync(join(outDir, 'schema.graphql'), `${printSchemaWithDirectives(schema)}\n`);

const introspection = graphqlSync({ schema, source: getIntrospectionQuery() });
if (introspection.errors && introspection.errors.length > 0) {
  throw new Error(
    `Introspection failed: ${introspection.errors.map((error) => error.message).join(', ')}`,
  );
}
if (!introspection.data) {
  throw new Error('Introspection returned no data');
}

const lines: string[] = [];
renderSchema(introspection.data, {
  title: 'Auth Service — GraphQL API Reference',
  tocFieldTypes: ['Query', 'Mutation'],
  printer: (line: string) => lines.push(line),
});
writeFileSync(join(outDir, 'schema.md'), `${lines.join('\n')}\n`);

console.log('Generated docs/api/schema.graphql and docs/api/schema.md');
