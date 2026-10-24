# Changelog

All notable changes to PunyGuard are documented here.

## [Unreleased]

### Added

- Edge, Safari, and Brave build targets alongside Chrome and Firefox, all on MV3
- `pnpm safari:xcode` to wrap the Safari build in an Xcode project
- `typecheck` scripts and a per-browser CI build matrix with AMO lint

### Changed

- Workspace reorganized into `apps/extension`, `apps/site`, and `packages/core`
- Firefox and Safari now build as MV3 (WXT previously defaulted them to MV2)
- Firefox minimum version raised to 140 to declare `data_collection_permissions`

### Fixed

- Options page now opens in a tab as configured
- Firefox-only manifest keys no longer leak into Chromium builds

## [0.0.2] — 2026-10-22

### Added

- Initial MV3 cross-browser extension scaffold (WXT + React 19 + Tailwind + DaisyUI)
- Local UTS #39–inspired homoglyph / mixed-script / Punycode detection engine
- Popup (320×545), options page, toolbar badge states (green / amber / red)
- Content-script page recon for links, scripts, iframes, and HTML hosts
- GitHub Pages marketing site (`apps/site/`)
- CI, release draft, and Pages workflows
- Infinity brand mark (no shield)
