declare module 'graphql-markdown' {
  export interface RenderSchemaOptions {
    title?: string;
    prologue?: string;
    epilogue?: string;
    printer?: (line: string) => void;
    skipTableOfContents?: boolean;
    tocFieldTypes?: string[];
    headingLevel?: number;
    unknownTypeURL?: string | ((type: string) => string);
  }

  export function renderSchema(
    introspection: { __schema: unknown } | Record<string, unknown>,
    options?: RenderSchemaOptions,
  ): void;

  export function loadSchemaJSON(
    schemaPath: string,
    options?: Record<string, unknown>,
  ): Promise<{ __schema: unknown }>;
}
