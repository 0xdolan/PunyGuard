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

6. The **Release** workflow runs full CI, checks that the tag matches `package.json` and the changelog, builds every store zip with `SHA256SUMS.txt`, and creates a **draft** GitHub Release whose notes come from the changelog section. Review it and click **Publish release**.
7. Merge `main` back into `develop`.
8. Upload the store packages from the release:

   | Store                                                            | File                                                                 |
   | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
   | Chrome Web Store (Brave, Opera, Vivaldi users install from here) | `punyguard-x.y.z-chrome.zip`                                         |
   | Microsoft Edge Add-ons                                           | `punyguard-x.y.z-edge.zip`                                           |
   | Firefox Add-ons (AMO)                                            | `punyguard-x.y.z-firefox.zip` plus `…-sources.zip` for source review |
   | Safari (App Store Connect)                                       | On macOS: `pnpm safari:xcode`, then archive and upload in Xcode      |

## GitHub setup (one time)

1. **Push the repository**: `git push -u origin main`.
2. **Pages**: _Settings → Pages → Build and deployment → Source: **GitHub Actions**_. The **GitHub Pages** workflow deploys on pushes to `main` that touch the site, the core engine, or `package.json`, and you can run it manually from _Actions → GitHub Pages → Run workflow_. The site goes live at https://0xdolan.github.io/PunyGuard/.
3. **Actions permissions**: _Settings → Actions → General_
   - _Actions permissions_: allow all actions, or allow GitHub-authored actions plus `pnpm/action-setup` and `softprops/action-gh-release`.
   - _Workflow permissions_: leave **Read repository contents** as the default. Each workflow asks for the write scopes it needs.
4. **Branch protection** for `main` (and `develop`): _Settings → Rules → Rulesets → New branch ruleset_
   - Require a pull request before merging.
   - Require status checks: `Lint · Typecheck · Test`, `Build (chrome)`, `Build (edge)`, `Build (firefox)`, `Build (safari)`, `Build site`. These names appear after CI has run once.
   - Block force pushes.
5. **Tag protection**: add a tag ruleset for `v*` that restricts creation, update, and deletion to maintainers.
6. **Dependabot**: `.github/dependabot.yml` opens weekly update PRs for npm packages and GitHub Actions. Turn on _Settings → Code security → Dependabot alerts / security updates_ as well.
7. **Private vulnerability reporting**: _Settings → Code security → Private vulnerability reporting → Enable_ (see [SECURITY.md](../SECURITY.md)).

## Previewing GitHub Pages locally

The production site is served from the `/PunyGuard/` sub-path, so preview the production build rather than the dev server:

```bash
pnpm site:preview
# → http://localhost:4173/PunyGuard/
```

This runs the same `vite build` as the Pages workflow and serves `apps/site/dist` with the `/PunyGuard/` base path, exactly as GitHub will. For live editing, use `pnpm site:dev` (http://localhost:5173/PunyGuard/).

## Running CI locally

`pnpm verify` runs the same checks as the CI workflow in order: frozen install, Prettier, version check, ESLint, typecheck, unit and smoke tests, all four store zips, the AMO linter, and the site build. Only the macOS Safari Xcode job is left out.
