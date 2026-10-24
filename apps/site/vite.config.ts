import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/PunyGuard/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
  },
  resolve: {
    alias: {
      '@punyguard/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  optimizeDeps: {
    include: ['unicode-properties', 'punycode'],
  },
});
