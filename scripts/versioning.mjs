// Shared helpers for scripts/version-bump.mjs and scripts/version-check.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_URL = 'https://github.com/0xdolan/PunyGuard';

/** Every package.json whose version must match the root. */
export const PACKAGE_FILES = [
  'package.json',
  'apps/extension/package.json',
  'apps/site/package.json',
  'packages/core/package.json',
];

export const CHANGELOG = 'CHANGELOG.md';

// SemVer 2.0 without build metadata; store manifests cannot carry it.
export const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export const read = (file) => readFileSync(resolve(ROOT, file), 'utf8');
export const write = (file, text) => writeFileSync(resolve(ROOT, file), text);
export const readJson = (file) => JSON.parse(read(file));

export function rootVersion() {
  return readJson('package.json').version;
}

/** Body of the `## [version]` section, without its heading. */
export function changelogSection(changelog, version) {
  const lines = changelog.split('\n');
  const heading = new RegExp(`^## \\[${version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`);
  const start = lines.findIndex((l) => heading.test(l));
  if (start === -1) return null;
  let end = lines.findIndex((l, i) => i > start && (/^## \[/.test(l) || /^\[[^\]]+\]: /.test(l)));
  if (end === -1) end = lines.length;
  return lines
    .slice(start + 1, end)
    .join('\n')
    .trim();
}

export function fail(errors) {
  for (const e of errors) console.error(`✖ ${e}`);
  process.exit(1);
}
