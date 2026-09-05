import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', '**/*.ts'],
  },
  eslint.configs.recommended,
  prettier,
];
