#!/usr/bin/env python3
"""Find invisible, bidirectional, private-use, and lookalike Unicode in files.

Standard library only. Prints one line per finding and exits 1 if anything
at or above --fail-on was found, so it works in git hooks and CI.

    python3 docs/examples/unicode_scan.py src/ config/
    python3 docs/examples/unicode_scan.py --strict --fail-on warn $(git ls-files)

See docs/guide/04-invisible-code/03-detection-and-defense.md.
"""

import argparse
import os
import sys
import unicodedata

# (first, last, rule, severity, why)
RANGES = [
    (0x202A, 0x202E, "bidi", "error", "bidirectional embedding/override (Trojan Source)"),
    (0x2066, 0x2069, "bidi", "error", "bidirectional isolate (Trojan Source)"),
    (0x200E, 0x200F, "bidi", "error", "left-to-right / right-to-left mark"),
    (0x061C, 0x061C, "bidi", "error", "Arabic letter mark"),
    (0x3164, 0x3164, "filler", "error", "Hangul filler: blank, but a valid identifier letter"),
    (0xFFA0, 0xFFA0, "filler", "error", "halfwidth Hangul filler: blank, but a letter"),
    (0x115F, 0x1160, "filler", "error", "Hangul choseong/jungseong filler"),
    (0x2800, 0x2800, "filler", "warn", "Braille pattern blank"),
    (0x200B, 0x200D, "zero-width", "error", "zero-width space / non-joiner / joiner"),
    (0x2060, 0x2064, "zero-width", "error", "word joiner or invisible math operator"),
    (0xFEFF, 0xFEFF, "zero-width", "error", "zero-width no-break space (BOM mid-file)"),
    (0x00AD, 0x00AD, "zero-width", "warn", "soft hyphen"),
    (0x034F, 0x034F, "zero-width", "warn", "combining grapheme joiner"),
    (0x180E, 0x180E, "zero-width", "warn", "Mongolian vowel separator"),
    (0xE0000, 0xE007F, "tag", "error", "tag character (ASCII smuggling)"),
    (0xFE00, 0xFE0F, "variation-selector", "warn", "variation selector"),
    (0xE0100, 0xE01EF, "variation-selector", "error", "variation selector supplement"),
    (0xE000, 0xF8FF, "private-use", "error", "Private Use Area (no standard meaning)"),
    (0xF0000, 0xFFFFD, "private-use", "error", "Supplementary Private Use Area-A"),
    (0x100000, 0x10FFFD, "private-use", "error", "Supplementary Private Use Area-B"),
    (0xFF01, 0xFF5E, "fullwidth", "warn", "fullwidth ASCII lookalike (NFKC folds it)"),
]

# --strict adds the rest of General Punctuation (U+2000-U+206F), which also
# holds ordinary typography such as curly quotes, so it is noisy by default.
STRICT_RANGES = [
    (0x2000, 0x206F, "general-punctuation", "warn", "General Punctuation block"),
]

SEVERITY = {"info": 0, "warn": 1, "error": 2}
SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build"}


def classify(cp, strict):
    for first, last, rule, severity, why in RANGES:
        if first <= cp <= last:
            return rule, severity, why
    cat = unicodedata.category(chr(cp))
    if cat == "Cf":
        return "format", "error", "other invisible format character"
    if cat == "Zs" and cp != 0x20:
        return "space", "warn", "non-ASCII space"
    if cat in ("Zl", "Zp"):
        return "line-separator", "error", "Unicode line/paragraph separator"
    if cat == "Cc" and chr(cp) not in "\t\n\r":
        return "control", "error", "C0/C1 control character"
    if strict:
        for first, last, rule, severity, why in STRICT_RANGES:
            if first <= cp <= last:
                return rule, severity, why
    return None


def iter_files(paths):
    for path in paths:
        if os.path.isdir(path):
            for root, dirs, files in os.walk(path):
                dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
                for name in files:
                    yield os.path.join(root, name)
        else:
            yield path


def scan_file(path, strict):
    try:
        with open(path, "rb") as fh:
            data = fh.read()
    except OSError as err:
        print(f"{path}: cannot read: {err}", file=sys.stderr)
        return []
    if b"\0" in data[:8192]:
        return []  # binary file
    text = data.decode("utf-8", errors="replace")
    findings = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        for col, ch in enumerate(line, start=1):
            cp = ord(ch)
            if cp < 0x80:
                if ch == "\t" or 0x20 <= cp < 0x7F:
                    continue
            hit = classify(cp, strict)
            if hit:
                rule, severity, why = hit
                name = unicodedata.name(ch, "UNNAMED")
                findings.append((path, lineno, col, cp, name, rule, severity, why))
    return findings


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("paths", nargs="+", help="files or directories to scan")
    ap.add_argument("--strict", action="store_true", help="also flag all of U+2000-U+206F")
    ap.add_argument("--fail-on", choices=SEVERITY, default="error", help="exit 1 at this severity")
    args = ap.parse_args()

    worst = -1
    for path in iter_files(args.paths):
        for path_, line, col, cp, name, rule, severity, why in scan_file(path, args.strict):
            worst = max(worst, SEVERITY[severity])
            print(f"{path_}:{line}:{col}: {severity}: U+{cp:04X} {name} [{rule}] {why}")
    return 1 if worst >= SEVERITY[args.fail_on] else 0


if __name__ == "__main__":
    sys.exit(main())
