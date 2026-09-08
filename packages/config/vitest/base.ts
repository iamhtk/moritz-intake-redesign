import type { ViteUserConfig } from 'vitest/config';
import { defineConfig, mergeConfig } from 'vitest/config';
import type { CoverageOptions } from 'vitest/node';
import { fileURLToPath } from 'node:url';

type CreateVitestConfigOptions = {
  setupFiles?: string | string[];
  serverSetupFiles?: string | string[];
  alias?: NonNullable<ViteUserConfig['resolve']>['alias'];
  environment?: string;
  include?: string[];
  coverage?: CoverageOptions;
  serverTestPatterns?: string[];
  exclude?: string | string[];
  additionalConfig?: ViteUserConfig;
};

const defaultInclude = [
  '**/__tests__/**/*.{test,spec}.{ts,tsx}',
  '**/?(*.){test,spec}.{ts,tsx}',
];

const defaultServerTestPatterns = [
  ['**/*.server.{test,spec}.{ts,tsx}', 'node'],
  ['**/*.node.{test,spec}.{ts,tsx}', 'node'],
] satisfies Array<[string, string]>;

const serverPatterns = defaultServerTestPatterns.map(([pattern]) => pattern);

const defaultExcludePatterns = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '.next/**',
  '.turbo/**',
  'coverage/**',
];

const sharedNoiseFilterSetupFile = fileURLToPath(
  new URL('./noise-filter.ts', import.meta.url),
);

function withSharedSetupFiles(files: string | string[]): string[] {
  const userFiles = Array.isArray(files) ? files : [files];
  return [sharedNoiseFilterSetupFile, ...userFiles];
}

export function createVitestConfig({
  setupFiles = [],
  serverSetupFiles = [],
  alias = {},
  environment = 'jsdom',
  include = defaultInclude,
  coverage = {
    provider: 'v8',
    reporter: ['text', 'html'],
  },
  serverTestPatterns = serverPatterns,
  exclude = ['e2e/**/*'],
  additionalConfig = {},
}: CreateVitestConfigOptions = {}) {
  const sharedEsbuild = {
    jsx: 'automatic' as const,
    jsxImportSource: 'react',
  };

  const userExclude = Array.isArray(exclude)
    ? exclude
    : exclude
      ? [exclude]
      : [];
  const normalizedExclude = [...defaultExcludePatterns, ...userExclude];

  const clientProject: ViteUserConfig = {
    resolve: {
      alias,
    },
    esbuild: sharedEsbuild,
    test: {
      name: 'client',
      globals: true,
      environment,
      include,
      exclude: [...serverTestPatterns, ...normalizedExclude],
      setupFiles: withSharedSetupFiles(setupFiles),
      clearMocks: true,
      mockReset: true,
      restoreMocks: true,
    },
  };

  const serverProject: ViteUserConfig = {
    resolve: {
      alias,
    },
    esbuild: sharedEsbuild,
    test: {
      name: 'server',
      globals: true,
      environment: 'node',
      include: serverTestPatterns,
      exclude: normalizedExclude,
      setupFiles: withSharedSetupFiles(serverSetupFiles),
      clearMocks: true,
      mockReset: true,
      restoreMocks: true,
    },
  };

  return mergeConfig(
    defineConfig({
      test: {
        coverage,
        projects: [clientProject, serverProject],
      },
    }),
    additionalConfig,
  );
}
