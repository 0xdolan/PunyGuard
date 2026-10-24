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
3. CI must pass (lint, unit tests, builds).
4. Tag releases as `vX.Y.Z` to draft GitHub Releases with zipped artifacts.

## Local setup

```bash
pnpm install
pnpm dev
pnpm test
```

## Code standards

- TypeScript strict mode
- No remote network calls in the live detection path
- Prefer clear threat reasons over opaque scores
- Match existing UI patterns (320×545 popup, DaisyUI themes)

## License

Contributions are licensed under **GNU GPL v3**.
