import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', '**/*.ts'],
  },
  eslint.configs.recommended,
  prettier,
  {
    // Node CommonJS helpers (Jest transformer and integration setup)
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        __filename: 'readonly',
      },
    },
  },
];
