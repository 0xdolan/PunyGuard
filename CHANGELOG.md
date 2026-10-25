# Changelog

All notable changes to PunyGuard are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). See [docs/RELEASING.md](docs/RELEASING.md) for the release process.

## [Unreleased]

### Fixed

- Popup showed "No active page" and zero counts while the badge reported a risk, because per-tab results were lost when the MV3 background was unloaded; results now persist in session storage
- Iframe scans no longer overwrite the top page's result, and the load-complete scan no longer replaces the content script's fuller scan

## [0.0.2] - 2026-10-24

First public release.

### Added

- MV3 extension for Chrome, Edge, Brave, Firefox (140+), and Safari (15.4+) from one WXT + React 19 codebase
- Local UTS #39-inspired homoglyph, mixed-script, invisible-character, and Punycode detection engine
- Popup (31rem × max 34rem), options page, analyzer tab, and toolbar badge (green / amber / red)
- Content-script page recon for links, scripts, iframes, and IDN mentions in page HTML
- Unicode inspector with per-character `U+`, name, block, script, and escapes
- Character table with a sort toggle and a multi-select filter on every column, plus a search box across all columns
- Character details in a side drawer (keyboard navigable, every value copyable) that leaves the table its full width
- Prominent IDN · Punycode card showing the Unicode and ASCII forms side by side, with non-ASCII characters and `xn--` labels highlighted
- "Get the extension" section on the site with a button for each browser
- Release packages for every browser: Chrome/Brave/Opera/Vivaldi and Edge zips, a Firefox `.xpi` (signed when Mozilla API keys are configured), AMO upload and sources zips, a Safari bundle and ready-to-open Xcode project, and `SHA256SUMS.txt`
- GitHub Pages site with the inspector (`apps/site/`)
- `pnpm safari:xcode` to wrap the Safari build in an Xcode project
- CI (format, version, lint, typecheck, tests, per-browser builds, AMO lint), tag-driven release drafts, and Pages deploys
- `pnpm version:bump` / `pnpm version:check` to keep the version identical across packages, manifest, UI, and changelog
- `pnpm verify` runs the full CI locally, and a `pre-push` hook blocks pushes when it fails
- Keypad brand mark

### Fixed

- Minified script text such as `t.substr(0,e)+"…"}function` is no longer reported as a hostname
- Lookalike domains inside JavaScript strings are extracted without surrounding quotes

[Unreleased]: https://github.com/0xdolan/PunyGuard/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/0xdolan/PunyGuard/releases/tag/v0.0.2
