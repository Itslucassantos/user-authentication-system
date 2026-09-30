import type { CodegenConfig } from '@graphql-codegen/cli';

/**
 * Reads the SDL printed by `npm run docs:api` (docs/api/schema.graphql) instead of the TS
 * template-string modules directly, so this config doesn't need its own schema loader for
 * `.ts` files — run `npm run docs:api` before `npm run codegen` (or just `npm run codegen`,
 * which chains the two).
 *
 * Only the `typescript` plugin runs, producing `<Op><Field>Args` interfaces for every
 * query/mutation argument list. Resolvers import these instead of hand-written duplicates,
 * so a schema change that isn't reflected in a resolver fails `tsc`, not silently at runtime
 * (seção 9.3/13.1 do ddd-modeling.md — "nada garante em compile-time que batem com a SDL real").
 */
const config: CodegenConfig = {
  schema: 'docs/api/schema.graphql',
  generates: {
    'src/interface/graphql/generated/schema-types.ts': {
      plugins: ['typescript'],
      config: {
        typesPrefix: 'Gql',
        scalars: { ID: 'string' },
        enumsAsTypes: true,
        skipTypename: true,
        avoidOptionals: { field: false, inputValue: false, object: false, defaultValue: true },
      },
    },
  },
  hooks: {
    afterOneFileWrite: ['prettier --write'],
  },
};

export default config;
