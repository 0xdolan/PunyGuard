# PunyGuard

**Local-first protection against IDN homograph attacks, lookalike domains, and phishing script spoofing.**

[![CI](https://github.com/0xdolan/PunyGuard/actions/workflows/ci.yml/badge.svg)](https://github.com/0xdolan/PunyGuard/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Site](https://img.shields.io/badge/site-GitHub%20Pages-111111)](https://0xdolan.github.io/PunyGuard/)

<p align="center">
  <img src="assets/brand/logo.svg" alt="PunyGuard" width="160" />
</p>

PunyGuard is an open-source cross-browser extension (Chrome, Edge, Brave, Firefox, Safari) that inspects hostnames on every page — including embedded links, scripts, and iframes — for Unicode lookalikes and mixed-script phishing tells. Analysis runs **entirely on-device** so your browsing data never leaves your machine during live checks.

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

## Browser support

All targets ship Manifest V3 from one codebase.

| Browser | Minimum      | Build                       | Output                                 | Load unpacked                                                          |
| ------- | ------------ | --------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| Chrome  | 88+          | `pnpm build`                | `apps/extension/.output/chrome-mv3`    | `chrome://extensions` → Developer mode → Load unpacked                 |
| Brave   | Chromium 88+ | `pnpm build`                | `apps/extension/.output/chrome-mv3`    | `brave://extensions` → Developer mode → Load unpacked                  |
| Edge    | 88+          | `pnpm build:edge`           | `apps/extension/.output/edge-mv3`      | `edge://extensions` → Developer mode → Load unpacked                   |
| Firefox | 140+         | `pnpm build:firefox`        | `apps/extension/.output/firefox-mv3`   | `about:debugging` → This Firefox → Load Temporary Add-on               |
| Safari  | 15.4+        | `pnpm safari:xcode` (macOS) | `apps/extension/safari/` Xcode project | Run the app in Xcode, then enable it in Safari → Settings → Extensions |

Brave and other Chromium browsers (Opera, Vivaldi) use the Chrome build and install from the Chrome Web Store. Safari requires macOS with Xcode; `pnpm safari:xcode` builds `safari-mv3` and wraps it with `safari-web-extension-converter`.

## Develop

```bash
pnpm install
pnpm dev            # Chrome with live reload
pnpm dev:firefox    # Firefox with live reload
pnpm build:all      # Chrome, Edge, Firefox, Safari builds
pnpm zip:all        # Store-ready zips (+ Firefox sources zip for AMO)
pnpm lint && pnpm typecheck && pnpm test
pnpm test:e2e       # Playwright smoke tests
pnpm docs:dev       # Marketing site (GitHub Pages source)
```

## Repository layout

```
apps/
  extension/      Browser extension (WXT + React)
    public/icons/ Toolbar & store icons
    src/          Entrypoints, components, lib
    tests/        Vitest unit + Playwright smoke tests
  site/           GitHub Pages marketing site & inspector
packages/
  core/           Detection engine shared by extension and site
assets/brand/     Brand mark source files
.github/          CI/CD & Pages workflows
```

## License

[GNU GPL v3](./LICENSE) — Made ❤️ by [0xdolan](https://github.com/0xdolan)
