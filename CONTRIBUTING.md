# Contributing to PunyGuard

Thank you for helping people stay safer online.

## GitFlow

| Branch      | Purpose                                 |
| ----------- | --------------------------------------- |
| `main`      | Stable releases / Pages source of truth |
| `develop`   | Integration branch                      |
| `feature/*` | New features                            |
| `release/*` | Release hardening                       |
| `hotfix/*`  | Urgent production fixes                 |

1. Branch from `develop` (or `main` for hotfixes).
2. Keep PRs focused; include tests for engine changes.
3. Use [Conventional Commits](https://www.conventionalcommits.org/). CI must pass; run `pnpm verify` locally first.
4. Add user-facing changes to `CHANGELOG.md` under `## [Unreleased]`.
5. Releases, versioning, and tags follow [docs/RELEASING.md](docs/RELEASING.md).

## Local setup

```bash
pnpm install
pnpm dev        # Chrome with live reload
pnpm verify     # everything CI checks
```

## Code standards

- TypeScript strict mode
- No remote network calls in the live detection path
- Prefer clear threat reasons over opaque scores
- Match existing UI patterns (31rem × max 34rem popup, DaisyUI themes)
- Never hard-code the version; use `APP_VERSION` (extension) or `__APP_VERSION__` (site)

## License

Contributions are licensed under **GNU GPL v3**.
