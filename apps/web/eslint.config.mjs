import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // Next.js recommended rules (App Router + TypeScript)
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    rules: {
      // -----------------------------------------------------------------------
      // TypeScript — enforce CLAUDE.md §2.1 strict patterns
      // -----------------------------------------------------------------------

      // Disallow `any` — use `unknown` + narrowing or `// @ts-expect-error` + comment
      '@typescript-eslint/no-explicit-any': 'error',

      // Disallow @ts-ignore — must use @ts-expect-error with an explanation
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10,
        },
      ],

      // Enforce `import type` for type-only imports (tree-shaking + clarity)
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Catch unused variables — prefix with _ to explicitly ignore
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // -----------------------------------------------------------------------
      // Security — CLAUDE.md §2.1 forbidden patterns
      // -----------------------------------------------------------------------

      // Never use dangerouslySetInnerHTML (XSS vector)
      'react/no-danger': 'error',

      // No eval or Function constructor
      'no-eval': 'error',
      'no-new-func': 'error',

      // -----------------------------------------------------------------------
      // Logging — structured logger only in production code (CLAUDE.md §2.1)
      // -----------------------------------------------------------------------
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // -----------------------------------------------------------------------
      // React — App Router patterns
      // -----------------------------------------------------------------------

      // Exhaustive deps prevents stale closures
      'react-hooks/exhaustive-deps': 'error',

      // Useless fragments add noise
      'react/jsx-no-useless-fragment': 'error',

      // -----------------------------------------------------------------------
      // Import hygiene — prevent server-only code in client components
      // -----------------------------------------------------------------------
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/server/*'],
              message:
                'Server-only modules cannot be imported by client components. Use a Server Component or Server Action.',
            },
          ],
        },
      ],

      // -----------------------------------------------------------------------
      // General quality
      // -----------------------------------------------------------------------
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-debugger': 'error',
    },
  },

  // Test files — relax rules that are too strict for test code
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
    },
  },

  // Server-only files — may import freely from server/
  {
    files: [
      '**/server/**/*.ts', 
      '**/actions/**/*.ts', 
      '**/actions.ts',
      '**/queries/**/*.ts', 
      '**/queries.ts',
      'app/api/**/*.ts',
      'app/**/page.tsx',
      'app/**/layout.tsx'
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  // Local verification scripts are operational tooling, not browser code.
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
      'no-restricted-imports': 'off',
    },
  },

  // Ignore generated and build output
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'dist/**', 'next-env.d.ts'],
  },
];

export default config;
