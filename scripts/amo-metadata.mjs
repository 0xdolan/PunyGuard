#!/usr/bin/env node
// Write the AMO version metadata (release notes from this version's changelog
// section) for `web-ext sign --amo-metadata`.
//
//   node scripts/amo-metadata.mjs <out.json>
import { writeFileSync } from 'node:fs';
import { CHANGELOG, changelogSection, fail, read, rootVersion } from './versioning.mjs';

const out = process.argv[2];
if (!out) fail(['usage: node scripts/amo-metadata.mjs <out.json>']);

const version = rootVersion();
const notes = changelogSection(read(CHANGELOG), version);
if (!notes) fail([`${CHANGELOG} has no section for ${version}`]);

writeFileSync(out, JSON.stringify({ version: { release_notes: { 'en-US': notes } } }, null, 2));
console.log(`✔ AMO release notes for v${version} written to ${out}`);
