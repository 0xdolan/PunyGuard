# Runnable examples

Companion scripts for the [documentation](../README.md). They use only the Python 3 standard library (and bash for the hook). None of them makes network calls or executes decoded content.

| File                                           | What it does                                                                                                         | Guide                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [invisible_codec.py](invisible_codec.py)       | Hides text in Hangul-filler characters and decodes it again, UTF-8 safe                                              | [4.1](../guide/04-invisible-code/01-hiding-data-in-invisible-characters.md) |
| [unicode_scan.py](unicode_scan.py)             | Reports invisible, bidi, private-use, tag, and lookalike characters with file, line, and column; exits 1 on findings | [4.3](../guide/04-invisible-code/03-detection-and-defense.md)               |
| [pre-commit-unicode.sh](pre-commit-unicode.sh) | Git pre-commit hook that runs the scanner on staged files                                                            | [4.3](../guide/04-invisible-code/03-detection-and-defense.md)               |

## Quick start

```bash
# Hide and reveal a message
python3 docs/examples/invisible_codec.py "Hello"

# Scan a directory (add --strict to flag all of U+2000-U+206F, --fail-on warn to fail on warnings)
python3 docs/examples/unicode_scan.py src/

# Scan every file git tracks
git ls-files -z | xargs -0 python3 docs/examples/unicode_scan.py
```

## Install the pre-commit hook

```bash
mkdir -p .githooks
cp docs/examples/unicode_scan.py .githooks/
cp docs/examples/pre-commit-unicode.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

These scripts are teaching tools and a starting point; adapt the rules in `unicode_scan.py` (the `RANGES` table) to your project's policy.
