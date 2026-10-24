# Changelog

All notable changes to PunyGuard are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). See [docs/RELEASING.md](docs/RELEASING.md) for the release process.

## [Unreleased]

## [0.0.2] — 2026-10-23

First public release.

### Added

- MV3 extension for Chrome, Edge, Brave, Firefox (140+), and Safari (15.4+) from one WXT + React 19 codebase
- Local UTS #39–inspired homoglyph, mixed-script, invisible-character, and Punycode detection engine
- Popup (31rem × max 34rem), options page, analyzer tab, and toolbar badge (green / amber / red)
- Content-script page recon for links, scripts, iframes, and IDN mentions in page HTML
- Unicode inspector with per-character `U+`, name, block, script, and escapes
- GitHub Pages site with the inspector (`apps/site/`)
- `pnpm safari:xcode` to wrap the Safari build in an Xcode project
- CI (format, version, lint, typecheck, tests, per-browser builds, AMO lint), tag-driven release drafts, and Pages deploys
- `pnpm version:bump` / `pnpm version:check` to keep the version identical across packages, manifest, UI, and changelog
- Keypad brand mark

### Fixed

- Minified script text such as `t.substr(0,e)+"…"}function` is no longer reported as a hostname
- Lookalike domains inside JavaScript strings are extracted without surrounding quotes

[Unreleased]: https://github.com/0xdolan/PunyGuard/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/0xdolan/PunyGuard/releases/tag/v0.0.2
