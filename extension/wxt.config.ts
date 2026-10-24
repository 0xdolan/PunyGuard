import { defineConfig } from 'wxt';
import { resolve } from 'node:path';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  publicDir: 'assets',
  manifest: {
    name: 'PunyGuard',
    description:
      'Local-first protection against IDN homograph attacks, lookalike domains, and phishing script spoofing.',
    version: '0.0.2',
    homepage_url: 'https://0xdolan.github.io/PunyGuard/',
    permissions: ['storage', 'tabs', 'scripting', 'activeTab'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'PunyGuard',
      default_popup: 'popup.html',
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    icons: {
      '16': 'icon-16.png',
      '32': 'icon-32.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png',
    },
    browser_specific_settings: {
      gecko: {
        id: 'punyguard@0xdolan',
        strict_min_version: '121.0',
      },
    },
  },
  vite: () => ({
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@punyguard/core': resolve(__dirname, '../packages/core/src/index.ts'),
      },
    },
    optimizeDeps: {
      include: ['unicode-properties', 'punycode'],
    },
    build: {
      chunkSizeWarningLimit: 600,
    },
  }),
});
