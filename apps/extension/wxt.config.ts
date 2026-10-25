import { defineConfig } from 'wxt';
import { resolve } from 'node:path';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  // WXT defaults Firefox and Safari to MV2; ship MV3 everywhere.
  manifestVersion: 3,
  targetBrowsers: ['chrome', 'edge', 'firefox', 'safari'],
  zip: {
    artifactTemplate: 'punyguard-{{version}}-{{browser}}.zip',
    sourcesTemplate: 'punyguard-{{version}}-sources.zip',
    // AMO reviewers rebuild from this zip, so it must hold the whole pnpm workspace
    // (packages/core, lockfile), not just this app. Build: see README "Develop".
    sourcesRoot: resolve(__dirname, '../..'),
    // Since WXT 0.21 this is the full include list, not extra files; dotfiles need naming.
    includeSources: ['**/*', '.nvmrc'],
    excludeSources: [
      '.agents/**',
      '.github/**',
      'apps/site/**',
      'apps/extension/safari/**',
      'assets/**',
      'docs/**',
      'release/**',
      'skills-lock.json',
      '**/.output/**',
      '**/.wxt/**',
      '**/dist/**',
      '**/test-results/**',
    ],
  },
  manifest: ({ browser }) => ({
    name: 'PunyGuard',
    description:
      'Local-first protection against IDN homograph attacks, lookalike domains, and phishing script spoofing.',
    // `version` comes from package.json; WXT moves prerelease tags into `version_name`.
    homepage_url: 'https://0xdolan.github.io/PunyGuard/',
    permissions: ['storage', 'tabs'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'PunyGuard',
      default_popup: 'popup.html',
    },
    icons: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '96': 'icons/icon-96.png',
      '128': 'icons/icon-128.png',
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'punyguard@0xdolan',
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
    ...(browser === 'safari' && {
      browser_specific_settings: {
        safari: { strict_min_version: '15.4' },
      },
    }),
  }),
  vite: () => ({
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@punyguard/core': resolve(__dirname, '../../packages/core/src/index.ts'),
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
