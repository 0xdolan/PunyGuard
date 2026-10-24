import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { version } = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as {
  version: string;
};

export default defineConfig({
  base: '/PunyGuard/',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
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
