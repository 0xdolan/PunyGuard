#!/bin/sh
# Wrap the Safari MV3 build in an Xcode project (macOS + Xcode required).
# Run via `pnpm safari:xcode`; output goes to apps/extension/safari/.
set -eu

cd "$(dirname "$0")/.."

if ! command -v xcrun >/dev/null 2>&1; then
  echo "xcrun not found: Safari packaging requires macOS with Xcode installed." >&2
  exit 1
fi

if [ ! -f .output/safari-mv3/manifest.json ]; then
  echo "Missing .output/safari-mv3 — run 'pnpm build:safari' first." >&2
  exit 1
fi

xcrun safari-web-extension-converter .output/safari-mv3 \
  --project-location safari \
  --app-name PunyGuard \
  --bundle-identifier io.github.0xdolan.PunyGuard \
  --copy-resources \
  --no-open \
  --no-prompt \
  --force
