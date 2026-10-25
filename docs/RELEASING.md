# Releasing PunyGuard

This guide covers how versions, the changelog, tags, and releases fit together, and how to set up GitHub so CI, releases, and Pages run.

## Rules

### One version, everywhere

The root `package.json` `version` is the single source of truth. Everything else derives from it:

| Where                                            | How it gets the version                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `apps/*/package.json`, `packages/*/package.json` | Written by `pnpm version:bump`; enforced by `pnpm version:check`                |
| Extension manifest                               | WXT reads `apps/extension/package.json` at build time                           |
| Popup and options footers                        | `browser.runtime.getManifest()` at runtime (`APP_VERSION`)                      |
| GitHub Pages site footer                         | `__APP_VERSION__`, injected by Vite from `apps/site/package.json`               |
| README version badge                             | Static badge rewritten by `pnpm version:bump`; enforced by `pnpm version:check` |
| `CHANGELOG.md`                                   | `## [x.y.z] - YYYY-MM-DD` section plus a `[x.y.z]:` link                        |
| Git tag / GitHub Release                         | `vx.y.z`; the release workflow fails if it differs from `package.json`          |

Never type a version number into source code. `pnpm version:check` (run in CI) fails if `vX.Y.Z` appears under `apps/*/src` or `packages/*/src`.

### Semantic Versioning

PunyGuard follows [SemVer 2.0](https://semver.org/). While the major version is `0`, minor releases may change behavior.

| Bump      | When                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------- |
| **major** | New permissions or host access, settings that don't migrate, a raised browser minimum, removed features |
| **minor** | New detections, UI features, new browser targets, new settings with defaults                            |
| **patch** | Bug fixes, false-positive/negative fixes, copy and style fixes, dependency updates                      |

Prereleases use `x.y.z-beta.N` (or `-rc.N`). Stores only accept dotted numbers, so WXT ships `x.y.z` as the manifest `version` and puts the full string in Chromium's `version_name`. A tag with `-` creates a GitHub **prerelease**.

### Changelog

- Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Group entries under `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
- Every user-facing PR adds a line under `## [Unreleased]`. Write it for users, not as commit history.
- `pnpm version:bump` turns `Unreleased` into the dated release section and updates the compare links. It refuses to run if `Unreleased` is empty.

### Every release must have

- [ ] A `## [x.y.z] - YYYY-MM-DD` section in `CHANGELOG.md`, dated the day you tag, with user-facing entries and its `[x.y.z]:` compare link.
- [ ] The same `x.y.z` in every `package.json`, the manifest, the README badge, and the annotated tag `vx.y.z` on `main`.
- [ ] A green `pnpm verify` locally, then a green CI on the release PR.
- [ ] Release notes generated from that changelog section, with a downloads table for every browser (the release workflow does this; never hand-edit the version or file list).
- [ ] Every package in the table below, plus `SHA256SUMS.txt`.

`pnpm version:check --tag vx.y.z` enforces the version, tag, and changelog parts; the release workflow runs it and stops on any mismatch.

### Commits, branches, and tags

- Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `ci:`, `chore:`. Mark breaking changes with `!` (for example `feat!:`).
- GitFlow branches: `main` (released), `develop` (integration), `feature/*`, `release/*`, `hotfix/*`.
- Tags are annotated, `v`-prefixed, and created on `main` only: `git tag -a v1.2.3 -m "v1.2.3"`.
- Never move or delete a pushed tag. If a release is broken, ship the next patch.

## Cutting a release

1. Branch `release/x.y.z` from `develop` (or `hotfix/x.y.z` from `main`).
2. Make sure `CHANGELOG.md` → `## [Unreleased]` lists everything user-facing.
3. Bump and verify:

   ```bash
   pnpm version:bump minor        # or patch | major | 1.2.0-beta.1
   pnpm format
   pnpm verify                    # same checks as GitHub CI, plus all store zips and the site
   ```

4. Commit `chore(release): vx.y.z`, open a PR into `main`, and merge it once CI passes.
5. Tag the merge commit on `main` and push:

   ```bash
   git switch main && git pull
   git tag -a vx.y.z -m "vx.y.z"
   git push origin vx.y.z
   ```

6. The **Release** workflow runs full CI, checks the tag against `package.json` and the changelog, builds every package (the Safari Xcode project on a macOS runner), and creates a **draft** GitHub Release. Its notes are the changelog section plus a downloads table. Review it and click **Publish release**.
7. Merge `main` back into `develop`.
8. Upload the store packages from the release (see the table below).

## Release packages

Each release ships one package per browser, so the site's download buttons and the README always have a file to point to:

| File                               | For                                       | Store upload                         |
| ---------------------------------- | ----------------------------------------- | ------------------------------------ |
| `punyguard-x.y.z-chrome.zip`       | Chrome, Brave, Opera, Vivaldi             | Chrome Web Store                     |
| `punyguard-x.y.z-edge.zip`         | Microsoft Edge                            | Edge Add-ons                         |
| `punyguard-x.y.z-firefox.xpi`      | Firefox 140+, direct install              |                                      |
| `punyguard-x.y.z-firefox.zip`      | Firefox                                   | addons.mozilla.org                   |
| `punyguard-x.y.z-sources.zip`      | Firefox source review                     | addons.mozilla.org                   |
| `punyguard-x.y.z-safari.zip`       | Safari web extension bundle               |                                      |
| `punyguard-x.y.z-safari-xcode.zip` | Safari 15.4+, ready-to-open Xcode project | App Store Connect (archive in Xcode) |
| `SHA256SUMS.txt`                   | Verifying downloads                       |                                      |

`.crx` files are not shipped: Chrome blocks installing them from outside its store on Windows and macOS.

Rehearse a release locally with `pnpm release:stage`. It builds every package into `release/` with checksums and the notes the workflow would publish (the Xcode project only builds on macOS).

### Signing the Firefox package (optional)

Unsigned `.xpi` files only install temporarily in regular Firefox. To ship a signed one that installs with a click, create API keys at https://addons.mozilla.org/developers/addon/api/key/ and add them as repository secrets named `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` (_Settings → Secrets and variables → Actions_). The release workflow then signs the `.xpi` as an unlisted add-on before publishing. Without the secrets, the step is skipped and the notes explain how to install the unsigned file.

### Store links

When a store listing goes live, set its URL in `apps/site/src/downloads.ts` (the `store` field). The site's button for that browser then opens the store instead of the release.

## GitHub setup

These are configured on `0xdolan/PunyGuard`; recreate them if you fork or move the repo.

1. **Visibility**: public (free Pages, rulesets, and unlimited Actions minutes need it).
2. **About**: website `https://0xdolan.github.io/PunyGuard/`, a description, and topics.
3. **Pages**: _Settings → Pages → Source: **GitHub Actions**_. The **GitHub Pages** workflow deploys on pushes to `main` that touch the site, the core engine, or `package.json`; run it manually from _Actions → GitHub Pages → Run workflow_.
4. **Actions**: all actions allowed; default workflow permissions **read-only**. Each workflow asks for the write scopes it needs.
5. **Ruleset "Protect main"** (_Settings → Rules → Rulesets_): no deletion, no force push, changes through a pull request, and these required checks: `Lint · Typecheck · Test`, `Build (chrome)`, `Build (edge)`, `Build (firefox)`, `Build (safari)`, `Safari Xcode project`, `Build site`.
6. **Ruleset "Protect release tags"**: `v*` tags cannot be moved or deleted once pushed (creating them is allowed).
7. **Merging**: branches are deleted automatically after merge.
8. **Security**: secret scanning with push protection and private vulnerability reporting (see [SECURITY.md](../SECURITY.md)). Dependabot is turned off (no config, no security update PRs, no alerts); update dependencies by hand and check them with `pnpm audit`.
9. **Optional secrets**: `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` to sign the Firefox package.

## Previewing GitHub Pages locally

The production site is served from the `/PunyGuard/` sub-path, so preview the production build rather than the dev server:

```bash
pnpm site:preview
# → http://localhost:4173/PunyGuard/
```

This runs the same `vite build` as the Pages workflow and serves `apps/site/dist` with the `/PunyGuard/` base path, exactly as GitHub will. For live editing, use `pnpm site:dev` (http://localhost:5173/PunyGuard/).

## Local CI first

Rule: **run the full CI locally, and only push to GitHub when it passes.** Never push to see whether GitHub's CI catches something.

`pnpm verify` runs the same checks as the CI workflow, in order: frozen install, Prettier, version and changelog check, dash check, ESLint, typecheck (core, extension, site), unit and smoke tests, all store packages, the AMO linter, release staging, and the site build. Only the macOS-only Safari Xcode build is left out.

A git `pre-push` hook (`.githooks/pre-push`, installed by `pnpm install`) runs `pnpm verify` on every push and blocks the push if anything fails. `git push --no-verify` skips it; keep that for emergencies only, never to get a red build onto GitHub.
