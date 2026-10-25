#!/usr/bin/env bash
# Block commits that add invisible, bidi, private-use, or tag characters.
#
# Install in a repository:
#   cp docs/examples/unicode_scan.py .githooks/unicode_scan.py
#   cp docs/examples/pre-commit-unicode.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
#
# It scans the staged version of each added or modified file, not the working
# copy, so what is checked is exactly what will be committed.
set -euo pipefail

SCANNER="$(git rev-parse --show-toplevel)/.githooks/unicode_scan.py"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git diff --cached --name-only --diff-filter=AM -z | while IFS= read -r -d '' file; do
  mkdir -p "$TMP/$(dirname "$file")"
  git show ":$file" > "$TMP/$file"
done

if ! python3 "$SCANNER" "$TMP" | sed "s#^$TMP/##"; then
  echo "pre-commit: suspicious Unicode found (see above). Commit blocked." >&2
  echo "If a character is intended, write it as an escape such as \\u00e9." >&2
  exit 1
fi
