#!/usr/bin/env node
// Bump the version everywhere and roll CHANGELOG "Unreleased" into a dated release.
//
//   pnpm version:bump patch|minor|major
//   pnpm version:bump 1.2.0-beta.1
//
// It edits files only; commit and tag as printed at the end.
import {
  CHANGELOG,
  PACKAGE_FILES,
  REPO_URL,
  SEMVER_RE,
  changelogSection,
  fail,
  read,
  readJson,
  rootVersion,
  write,
} from './versioning.mjs';

const arg = process.argv[2];
const current = rootVersion();

function next(kind) {
  const [major, minor, patch] = current.split('-')[0].split('.').map(Number);
  const isPre = current.includes('-');
  switch (kind) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      // 1.2.0-beta.1 → 1.2.0 finalizes the prerelease.
      return isPre ? `${major}.${minor}.${patch}` : `${major}.${minor}.${patch + 1}`;
    default:
      return kind;
  }
}

if (!arg) fail(['usage: pnpm version:bump <patch|minor|major|x.y.z[-pre]>']);
const version = next(arg);
if (!SEMVER_RE.test(version)) fail([`"${version}" is not valid SemVer`]);
if (version === current) fail([`already at ${version}`]);

const changelog = read(CHANGELOG);
const unreleased = changelogSection(changelog, 'Unreleased');
if (unreleased === null) fail([`${CHANGELOG} is missing "## [Unreleased]"`]);
if (!unreleased) fail([`${CHANGELOG} "Unreleased" is empty — record the changes first`]);

// Local calendar date, YYYY-MM-DD.
const date = new Date().toLocaleDateString('en-CA');
let updated = changelog.replace(
  /^## \[Unreleased\].*$/m,
  `## [Unreleased]\n\n## [${version}] — ${date}`,
);

// Link references: Unreleased compares from the new tag; the new version compares from the previous tag.
const prevTagged = new RegExp(`^\\[${current.replace(/\./g, '\\.')}\\]: `, 'm').test(changelog);
const versionLink = prevTagged
  ? `${REPO_URL}/compare/v${current}...v${version}`
  : `${REPO_URL}/releases/tag/v${version}`;
updated = updated.replace(
  /^\[Unreleased\]: .*$/m,
  `[Unreleased]: ${REPO_URL}/compare/v${version}...HEAD\n[${version}]: ${versionLink}`,
);
if (!/^\[Unreleased\]: /m.test(updated))
  updated = `${updated.trimEnd()}\n\n[Unreleased]: ${REPO_URL}/compare/v${version}...HEAD\n[${version}]: ${versionLink}\n`;
write(CHANGELOG, updated);

for (const file of PACKAGE_FILES) {
  const pkg = readJson(file);
  pkg.version = version;
  write(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

console.log(`✔ ${current} → ${version}

Next (see docs/RELEASING.md):
  pnpm format && pnpm verify
  git commit -am "chore(release): v${version}"
  # open a PR into main; after it merges:
  git switch main && git pull
  git tag -a v${version} -m "v${version}"
  git push origin v${version}`);
