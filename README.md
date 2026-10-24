# PunyGuard

**Local-first protection against IDN homograph attacks, lookalike domains, and phishing script spoofing.**

[![CI](https://github.com/0xdolan/PunyGuard/actions/workflows/ci.yml/badge.svg)](https://github.com/0xdolan/PunyGuard/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Site](https://img.shields.io/badge/site-GitHub%20Pages-111111)](https://0xdolan.github.io/PunyGuard/)

<p align="center">
  <img src="assets/logo.svg" alt="PunyGuard" width="160" />
</p>

PunyGuard is an open-source cross-browser extension (Chrome, Edge, Firefox, Safari) that inspects hostnames on every page — including embedded links, scripts, and iframes — for Unicode lookalikes and mixed-script phishing tells. Analysis runs **entirely on-device** so your browsing data never leaves your machine during live checks.

> Project site: [https://0xdolan.github.io/PunyGuard/](https://0xdolan.github.io/PunyGuard/)

## Why it matters

Attackers register domains that look identical to brands you trust by swapping Latin letters for Cyrillic, Greek, or Punycode encodings. Humans cannot reliably spot `раypal.com` vs `paypal.com`. PunyGuard can.

| Badge | Meaning                                        |
| ----- | ---------------------------------------------- |
| Green | No significant homograph indicators            |
| Amber | Punycode / IDN or elevated watch signals       |
| Red   | High-probability lookalike / mixed-script risk |

## Features

- UTS #39–inspired confusable / homoglyph detection (local matrix)
- Mixed-script and invisible-character detection
- **Unicode inspector** — paste any domain; see each character’s `U+`, formal name, block, script, category, hex/dec, escapes
- Search characters by name, `U+`, hex, decimal, block, or script; copy list to clipboard
- Extension **analyzer** tab + GitHub Pages inspector (`#/inspect`)
- Live page recon + toolbar threat badge (green / amber / red)
- Redesigned popup (padded, Inspect tab), options, Lucide icons, JetBrains Mono + Noto Sans
- GPL-3.0 open source

## Stack

TypeScript (strict) · React 19 · WebExtensions MV3 · **WXT** (Vite) · Tailwind · DaisyUI · Vitest · Playwright · pnpm

## Develop

```bash
pnpm install
pnpm dev          # Chrome MV3 via WXT
pnpm build        # Production Chrome/Edge build
pnpm build:firefox
pnpm test
pnpm docs:dev     # Marketing site (GitHub Pages source)
```

Load the unpacked build from `extension/.output/chrome-mv3` (or Firefox output) in your browser’s extension developer mode.

## Repository layout

```
extension/   Browser extension (WXT + React)
docs/        GitHub Pages site
assets/      Brand mark (keypad icon)
.github/     CI/CD & Pages workflows
```

## License

[GNU GPL v3](./LICENSE) — Made ❤️ by [0xdolan](https://github.com/0xdolan)
