# PunyGuard

**Local-first protection against IDN homograph attacks, lookalike domains, and phishing script spoofing.**

[![CI](https://github.com/0xdolan/PunyGuard/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/0xdolan/PunyGuard/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-0.1.1-FF1A1A)](CHANGELOG.md)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Site](https://img.shields.io/badge/site-GitHub%20Pages-111111)](https://0xdolan.github.io/PunyGuard/)

<p align="center">
  <img src="assets/brand/logo.svg" alt="PunyGuard" width="160" />
</p>

PunyGuard is an open-source cross-browser extension (Chrome, Edge, Brave, Firefox, Safari) that inspects hostnames on every page, including embedded links, scripts, and iframes, for Unicode lookalikes and mixed-script phishing tells. Analysis runs **entirely on-device** so your browsing data never leaves your machine during live checks.

> Project site: [https://0xdolan.github.io/PunyGuard/](https://0xdolan.github.io/PunyGuard/)

## Why it matters

Attackers register domains that look identical to brands you trust by swapping Latin letters for Cyrillic, Greek, or Punycode encodings. Humans cannot reliably spot `раypal.com` vs `paypal.com`. PunyGuard can.

| Badge | Meaning                                        |
| ----- | ---------------------------------------------- |
| Green | No significant homograph indicators            |
| Amber | Punycode / IDN or elevated watch signals       |
| Red   | High-probability lookalike / mixed-script risk |

## Features

- UTS #39-inspired confusable / homoglyph detection (local matrix)
- Mixed-script and invisible-character detection
- **Unicode inspector**: paste any domain; see each character’s `U+`, formal name, block, script, category, hex/dec, escapes
- Search characters by name, `U+`, hex, decimal, block, or script; copy list to clipboard
- Extension **analyzer** tab + GitHub Pages inspector (`#/inspect`)
- Live page recon + toolbar threat badge (green / amber / red)
- Popup with page results and an Inspect tab, plus a settings page (on/off, badge, iframe scanning, theme)
- Light and dark themes
- GPL-3.0 open source

## Learn: the PunyGuard guide

A tutorial-style course in [docs/](docs/README.md), from first principles to how the engine works, with runnable examples:

1. **Foundations**: [bits and bytes](docs/guide/01-foundations/01-bits-bytes-and-numbers.md), [ASCII](docs/guide/01-foundations/02-ascii.md), [Unicode](docs/guide/01-foundations/03-unicode.md), [encoding and decoding](docs/guide/01-foundations/04-encoding-and-decoding.md), [escapes](docs/guide/01-foundations/05-escapes-and-representations.md)
2. **Tricky Unicode**: [invisible characters](docs/guide/02-tricky-unicode/01-invisible-characters.md) (zero-width, Hangul fillers, Private Use Area, tags, fullwidth forms), [normalization](docs/guide/02-tricky-unicode/02-normalization.md), [confusables and scripts](docs/guide/02-tricky-unicode/03-confusables-and-scripts.md), [bidirectional text](docs/guide/02-tricky-unicode/04-bidirectional-text.md)
3. **Domains**: [how domain names work](docs/guide/03-domains/01-domain-names.md), [IDN and Punycode](docs/guide/03-domains/02-idn-and-punycode.md), [homograph attacks](docs/guide/03-domains/03-homograph-attacks.md)
4. **Invisible code**: [hiding data in invisible characters](docs/guide/04-invisible-code/01-hiding-data-in-invisible-characters.md), [attacks in source and config](docs/guide/04-invisible-code/02-attacks-in-source-and-config.md), [detection and defense](docs/guide/04-invisible-code/03-detection-and-defense.md)
5. **How PunyGuard works**: [architecture](docs/guide/05-how-punyguard-works/01-architecture.md), [domain detection pipeline](docs/guide/05-how-punyguard-works/02-domain-detection-pipeline.md), [character inspector](docs/guide/05-how-punyguard-works/03-character-inspector.md), [limitations and roadmap](docs/guide/05-how-punyguard-works/04-limitations-and-roadmap.md)

Plus a [glossary](docs/guide/glossary.md) and [examples](docs/examples/README.md): an invisible-text codec, a Unicode scanner, and a git pre-commit hook.

## Install

PunyGuard is not in the browser stores yet. Until it is, install a release build. You can also start from the [project site](https://0xdolan.github.io/PunyGuard/#get), which has a button per browser.

1. Open the [latest release](https://github.com/0xdolan/PunyGuard/releases/latest) and download the file for your browser:

   | Browser                       | File                               |
   | ----------------------------- | ---------------------------------- |
   | Chrome, Brave, Opera, Vivaldi | `punyguard-x.y.z-chrome.zip`       |
   | Microsoft Edge                | `punyguard-x.y.z-edge.zip`         |
   | Firefox 140+                  | `punyguard-x.y.z-firefox.xpi`      |
   | Safari 15.4+ (macOS)          | `punyguard-x.y.z-safari-xcode.zip` |

2. Chromium browsers: unzip it and load the folder as an unpacked extension. Firefox: open the `.xpi`. Safari: open the Xcode project and run it. Step-by-step details are in [Browser support](#browser-support) and in each release's notes.

Prefer to build it yourself? See [Develop](#develop).

## Privacy & permissions

Every check runs locally. PunyGuard makes no network requests during analysis and collects no data (the Firefox manifest declares `data_collection_permissions: none`).

| Permission                 | Why it is needed                                                     |
| -------------------------- | -------------------------------------------------------------------- |
| `<all_urls>` (host access) | Read the hostnames of links, scripts, and iframes on pages you visit |
| `tabs`, `activeTab`        | Know which page the popup and toolbar badge belong to                |
| `scripting`                | Run the page scanner                                                 |
| `storage`                  | Save your settings                                                   |

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

Brave and other Chromium browsers (Opera, Vivaldi) use the Chrome build. Safari requires macOS with Xcode; `pnpm safari:xcode` builds `safari-mv3` and wraps it with `safari-web-extension-converter`.

When loading unpacked, select the folder that contains `manifest.json`. File pickers hide `.output` because it starts with a dot: press Ctrl+H to show it, or paste the path.

## Develop

```bash
pnpm install
pnpm dev            # Chrome with live reload
pnpm dev:firefox    # Firefox with live reload
pnpm build:all      # Chrome, Edge, Firefox, Safari builds
pnpm zip:all        # Store-ready zips (+ Firefox sources zip for AMO)
pnpm verify         # Everything CI checks, locally (also runs before every git push)
pnpm release:stage  # Build every release package into release/ with checksums and notes
pnpm test:e2e       # Playwright smoke tests
pnpm site:dev       # Site with live reload → http://localhost:5173/PunyGuard/
pnpm site:preview   # Production Pages build → http://localhost:4173/PunyGuard/
```

## Releases & versioning

The version lives in the root `package.json` and is propagated to every package, the manifest, the popup and options footers, and the site. `pnpm version:bump <patch|minor|major>` bumps it and dates the changelog, and pushing a `vX.Y.Z` tag drafts a GitHub Release with every store zip. See [CHANGELOG.md](CHANGELOG.md) and [docs/RELEASING.md](docs/RELEASING.md), which also covers the one-time GitHub Actions and Pages setup.

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
docs/             Unicode security guide, runnable examples, maintainer docs
scripts/          Version, changelog, and dash checks
.github/          CI/CD & Pages workflows
```

## Contributing & security

Contributions are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md) for the branch flow and checks. `main` is protected, so changes land through pull requests with all CI checks passing.

Please report vulnerabilities, including detection bypasses, privately as described in [SECURITY.md](SECURITY.md).

## License

[GNU GPL v3](./LICENSE) · Made with ❤️ by [0xdolan](https://github.com/0xdolan)
