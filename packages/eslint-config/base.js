import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
import onlyWarn from 'eslint-plugin-only-warn';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      // *.sandbox.js files are program text executed inside agent sandboxes
      // (read as strings, e.g. Sandbox.downloadFromUrl). Importing one would
      // run it in the backend process instead.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/*.sandbox.js', '**/*.sandbox'],
              message:
                'Files named *.sandbox.js run inside agent sandboxes; read them as text, never import them.',
            },
          ],
        },
      ],
    },
  },
  {
    // The sandbox-side programs themselves: plain Node ESM, linted with the
    // Node/web globals they actually run with.
    files: ['**/*.sandbox.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
        URL: 'readonly',
      },
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ['dist/**'],
  },
];
