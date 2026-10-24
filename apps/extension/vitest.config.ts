import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@punyguard/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
});
