// @ts-check
// Google TypeScript Style (gts) + ajustements NestJS.
import {createRequire} from 'node:module';
import globals from 'globals';

const require = createRequire(import.meta.url);
const gts = require('gts/build/eslint.config.js');

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'prisma/generated/**',
    ],
  },
  ...gts,
  {
    languageOptions: {
      globals: {...globals.node, ...globals.jest},
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // NestJS: décorateurs & DI ne « lisent » pas les paramètres au sens ESLint.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {argsIgnorePattern: '^_', varsIgnorePattern: '^_'},
      ],
      // Nest utilise les décorateurs expérimentaux, gts n'y touche pas mais on documente ici.
    },
  },
];
