#!/usr/bin/env node
// Collect every browser package into release/, add checksums, and write the
// release notes (changelog section + downloads table). Run after `pnpm zip:all`.
//
//   node scripts/stage-release.mjs                         # local dry run
//   node scripts/stage-release.mjs --safari-xcode <zip> --signed-xpi <xpi>
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import {
  CHANGELOG,
  REPO_URL,
  ROOT,
  changelogSection,
  fail,
  read,
  rootVersion,
} from './versioning.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

const version = rootVersion();
const OUTPUT = resolve(ROOT, 'apps/extension/.output');
const DIST = resolve(ROOT, 'release');
const name = (suffix) => `punyguard-${version}-${suffix}`;

/** Release assets in download-table order. `from` is a WXT zip in .output unless given. */
const assets = [
  {
    file: name('chrome.zip'),
    from: name('chrome.zip'),
    browsers: 'Chrome, Brave, Opera, Vivaldi',
    install:
      'Unzip, then `chrome://extensions` (or `brave://extensions`) → Developer mode → Load unpacked. Also the Chrome Web Store upload.',
  },
  {
    file: name('edge.zip'),
    from: name('edge.zip'),
    browsers: 'Microsoft Edge',
    install:
      'Unzip, then `edge://extensions` → Developer mode → Load unpacked. Also the Edge Add-ons upload.',
  },
  { file: name('firefox.xpi'), from: name('firefox.zip'), browsers: 'Firefox 140+', install: '' },
  {
    file: name('firefox.zip'),
    from: name('firefox.zip'),
    browsers: 'Firefox (AMO upload)',
    install: 'Upload to addons.mozilla.org together with the sources zip.',
  },
  {
    file: name('sources.zip'),
    from: name('sources.zip'),
    browsers: 'Firefox reviewers',
    install: 'Full source for AMO review: `pnpm install --frozen-lockfile && pnpm build:firefox`.',
  },
  {
    file: name('safari.zip'),
    from: name('safari.zip'),
    browsers: 'Safari 15.4+ (bundle)',
    install: 'Web extension bundle for `xcrun safari-web-extension-converter`.',
  },
  {
    file: name('safari-xcode.zip'),
    from: null,
    browsers: 'Safari 15.4+ (macOS)',
    install:
      'Unzip, open the project in Xcode, Run, then enable PunyGuard in Safari → Settings → Extensions.',
  },
];

const signedXpi = flag('--signed-xpi');
const xcodeZip = flag('--safari-xcode');
const errors = [];

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

for (const a of assets) {
  let src = a.from && resolve(OUTPUT, a.from);
  if (a.file.endsWith('.xpi') && signedXpi) src = resolve(signedXpi);
  if (a.file.endsWith('safari-xcode.zip')) src = xcodeZip && resolve(xcodeZip);
  if (!src) {
    a.missing = true; // the Xcode project only builds on macOS
    continue;
  }
  if (!existsSync(src)) {
    errors.push(`missing ${src}${a.from ? ' (run pnpm zip:all)' : ''}`);
    continue;
  }
  copyFileSync(src, resolve(DIST, a.file));
}
if (errors.length) fail(errors);

// AMO reviewers rebuild from the sources zip, so it must hold the whole workspace.
// Zip entry names are stored uncompressed, so a byte search finds them.
const sourcesZip = resolve(DIST, name('sources.zip'));
const sourcesBytes = readFileSync(sourcesZip);
const missingSources = [
  'pnpm-lock.yaml',
  'packages/core/package.json',
  'apps/extension/wxt.config.ts',
]
  .filter((f) => !sourcesBytes.includes(f))
  .map((f) => `${sourcesZip} is missing ${f} (check zip.includeSources in wxt.config.ts)`);
if (missingSources.length) fail(missingSources);

const shipped = assets.filter((a) => !a.missing);
const sums = shipped
  .map(
    (a) =>
      `${createHash('sha256')
        .update(readFileSync(resolve(DIST, a.file)))
        .digest('hex')}  ${a.file}`,
  )
  .join('\n');
writeFileSync(resolve(DIST, 'SHA256SUMS.txt'), `${sums}\n`);

const xpiInstall = signedXpi
  ? 'Signed by Mozilla: open the file in Firefox to install.'
  : 'Unsigned: load it from `about:debugging` → This Firefox → Load Temporary Add-on (removed on restart), or install permanently in Firefox Developer Edition / Nightly with `xpinstall.signatures.required` off.';
const size = (f) => `${(statSync(resolve(DIST, f)).size / 1024).toFixed(0)} KB`;
const rows = shipped
  .map(
    (a) =>
      `| ${a.browsers} | [\`${a.file}\`](${REPO_URL}/releases/download/v${version}/${a.file}) | ${size(a.file)} | ${a.file.endsWith('.xpi') ? xpiInstall : a.install} |`,
  )
  .join('\n');

const notes = changelogSection(read(CHANGELOG), version);
if (!notes) fail([`${CHANGELOG} has no section for ${version}`]);

writeFileSync(
  resolve(DIST, 'notes.md'),
  `${notes}

## Downloads

| Browser | File | Size | Install |
| ------- | ---- | ---- | ------- |
${rows}

Verify a download with \`sha256sum -c SHA256SUMS.txt --ignore-missing\`. Full install guide: ${REPO_URL}#install

**Full changelog:** ${REPO_URL}/blob/v${version}/CHANGELOG.md
`,
);

console.log(`✔ staged ${shipped.length} packages for v${version} in release/`);
for (const a of shipped) console.log(`  ${a.file}  ${size(a.file)}`);
for (const a of assets.filter((x) => x.missing))
  console.log(`  (skipped ${a.file}: build it on macOS with pnpm safari:xcode)`);
console.log(`  SHA256SUMS.txt, notes.md`);
