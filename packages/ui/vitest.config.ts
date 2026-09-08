import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createVitestConfig } from '@repo/config/vitest/base';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default createVitestConfig({
  alias: {
    '@repo/ui': path.resolve(__dirname, 'src'),
  },
  include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}'],
  serverTestPatterns: [],
});
