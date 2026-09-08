import { nextJsConfig } from '@repo/eslint-config/next-js';
import globals from 'globals';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    files: ['next.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Tabular Playbook is a verbatim port of the Designwise demo. Its loose cell
    // value types and hand-tuned effect dependencies are part of the ported
    // behaviour, so tightening them here would mean rewriting the demo.
    files: ['components/design/tabular-playbook/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
