#!/usr/bin/env node
// Verify the version is consistent everywhere it appears.
//
//   node scripts/version-check.mjs                 # packages + changelog
//   node scripts/version-check.mjs --tag v1.2.3    # also require the tag to match
//   node scripts/version-check.mjs --notes out.md  # also write release notes for this version
import { execFileSync } from 'node:child_process';
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

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

const version = rootVersion();
const errors = [];

if (!SEMVER_RE.test(version)) errors.push(`package.json version "${version}" is not valid SemVer`);

for (const file of PACKAGE_FILES) {
  const v = readJson(file).version;
  if (v !== version) errors.push(`${file} is ${v}, expected ${version}`);
}

const changelog = read(CHANGELOG);
if (!/^## \[Unreleased\]/m.test(changelog))
  errors.push(`${CHANGELOG} is missing "## [Unreleased]"`);
const notes = changelogSection(changelog, version);
if (notes === null) errors.push(`${CHANGELOG} has no "## [${version}]" section`);
else if (!notes) errors.push(`${CHANGELOG} section for ${version} is empty`);
if (!changelog.includes(`[${version}]: ${REPO_URL}/`))
  errors.push(`${CHANGELOG} is missing the [${version}] link reference`);

// UI must read the version at runtime/build time, never hard-code it.
try {
  const hits = execFileSync(
    'git',
    ['grep', '-nF', `v${version}`, '--', 'apps/*/src', 'packages/*/src'],
    { encoding: 'utf8' },
  ).trim();
  if (hits) errors.push(`hard-coded version in source (use APP_VERSION instead):\n${hits}`);
} catch {
  /* git grep exits 1 when nothing matches */
}

const tag = flag('--tag');
if (tag !== undefined && tag !== `v${version}`)
  errors.push(`tag ${tag} does not match package version v${version}`);

if (errors.length) fail(errors);

const notesFile = flag('--notes');
if (notesFile) write(notesFile, `${notes}\n`);

console.log(`✔ version ${version} is consistent`);
