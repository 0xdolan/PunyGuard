#!/usr/bin/env node
// Project rule: no en dash (U+2013) or em dash (U+2014) anywhere, in repo
// files or commit messages. Use a hyphen, a colon, commas, or "to" instead.
// Write the code point as an escape if a dash is ever needed as data.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROOT, fail } from './versioning.mjs';

const DASH = /[\u2013\u2014]/;
const NAMES = { '\u2013': 'en dash', '\u2014': 'em dash' };
const BINARY = /\.(png|jpe?g|gif|ico|webp|woff2?|ttf|otf|zip)$/i;

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
const errors = [];

for (const file of git('ls-files', '-z', '--cached', '--others', '--exclude-standard')
  .split('\0')
  .filter(Boolean)) {
  if (BINARY.test(file)) continue;
  let text;
  try {
    text = readFileSync(resolve(ROOT, file), 'utf8');
  } catch {
    continue; // deleted in the working tree
  }
  if (!DASH.test(text)) continue;
  text.split('\n').forEach((line, i) => {
    const m = line.match(DASH);
    if (m) errors.push(`${file}:${i + 1}: ${NAMES[m[0]]}: ${line.trim().slice(0, 100)}`);
  });
}

// Commit messages: `--commits A..B` checks a range (CI passes the pushed or PR commits).
const i = process.argv.indexOf('--commits');
const range = i === -1 ? '-1' : process.argv[i + 1];
for (const entry of git('log', '--format=%h%x00%B%x1e', range).split('\x1e')) {
  const [sha, body = ''] = entry.trim().split('\0');
  const m = body.match(DASH);
  if (sha && m) errors.push(`commit ${sha} message contains an ${NAMES[m[0]]}`);
}

if (errors.length) fail(errors);
console.log('✔ no en or em dashes');
