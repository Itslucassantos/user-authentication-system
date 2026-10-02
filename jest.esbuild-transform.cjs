const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { transformSync } = require('esbuild');

const transformerHash = createHash('sha1').update(readFileSync(__filename)).digest('hex');

// Integration suite only: Sequelize models use legacy decorators on `declare` fields, which
// Babel rejects but esbuild (like tsc / tsx, which run the app) handles.
module.exports = {
  // Invalidate Jest's transform cache whenever this file (the options below) changes
  getCacheKey: (sourceText, sourcePath) =>
    createHash('sha1').update(transformerHash).update(sourcePath).update(sourceText).digest('hex'),

  process(sourceText, sourcePath) {
    const { code, map } = transformSync(sourceText, {
      loader: sourcePath.endsWith('.ts') ? 'ts' : 'js',
      format: 'cjs',
      target: 'node24',
      sourcemap: 'both',
      // `import.meta.url` does not exist in CommonJS output
      define: { 'import.meta.url': '__importMetaUrl' },
      banner: "const __importMetaUrl = require('node:url').pathToFileURL(__filename).href;",
      sourcefile: sourcePath,
      tsconfigRaw: { compilerOptions: { experimentalDecorators: true } },
    });
    return { code, map };
  },
};
