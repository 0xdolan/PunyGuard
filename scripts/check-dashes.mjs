#!/usr/bin/env node
// Project rule: no en dash (U+2013) or em dash (U+2014) anywhere, in repo
// files or the commit message. Use a hyphen, a colon, commas, or "to" instead.
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

const message = git('log', '-1', '--format=%B');
const m = message.match(DASH);
if (m) errors.push(`HEAD commit message contains an ${NAMES[m[0]]}`);

if (errors.length) fail(errors);
console.log('✔ no en or em dashes');
