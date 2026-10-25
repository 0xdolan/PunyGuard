# 4.3 Detection and defense

The one principle behind every technique on this page:

> **Inspect code points, not glyphs.** Anything that relies on how text looks (your eyes, a diff viewer, a screenshot) can be fooled. Anything that checks the actual numbers cannot.

This page goes from quick one-off checks to automated enforcement, then evaluates common tools against the attacks from [4.2](02-attacks-in-source-and-config.md).

## 1. Quick manual checks

### Make bytes visible

```bash
cat -v file.py            # non-ASCII bytes appear as M-x sequences
xxd file.py | less        # full hex dump
```

```text
$ printf 'x\u3164 = 1\n' | cat -v
xM-cM-^EM-$ = 1
```

### Search with a regular expression

GNU grep (`-P` needs a UTF-8 locale), ripgrep, and `git grep` all accept `\x{...}` code point escapes:

```bash
PATTERN='[\x{200B}-\x{200F}\x{202A}-\x{202E}\x{2060}-\x{2064}\x{2066}-\x{2069}\x{FEFF}\x{115F}\x{1160}\x{3164}\x{FFA0}\x{E000}-\x{F8FF}]'

LC_ALL=C.UTF-8 grep -rnP "$PATTERN" src/
rg -n "$PATTERN" .
LC_ALL=C.UTF-8 git grep -nP "$PATTERN"
```

To list every non-ASCII line (noisy, but nothing escapes it):

```bash
LC_ALL=C grep -rnP '[^\x00-\x7F]' src/
```

### Inspect one string in Python or JavaScript

```python
import unicodedata
for i, ch in enumerate(open("file.py", encoding="utf-8").read()):
    if ord(ch) > 0x7E or (ord(ch) < 0x20 and ch not in "\n\t"):
        print(i, f"U+{ord(ch):04X}", unicodedata.name(ch, "UNNAMED"))
```

Remember from [1.5](../01-foundations/05-escapes-and-representations.md): `print()`, `repr()`, and `console.log()` do not reliably reveal these characters. Use `ascii()` or print the code points.

## 2. The scanner: `docs/examples/unicode_scan.py`

[unicode_scan.py](../../examples/unicode_scan.py) is a standard-library-only scanner that reports file, line, column, code point, name, and rule, and exits with status 1 when it finds something. It checks:

| Rule                                           | Code points                                                                 | Severity   |
| ---------------------------------------------- | --------------------------------------------------------------------------- | ---------- |
| `bidi`                                         | U+200E-U+200F, U+202A-U+202E, U+2066-U+2069, U+061C                         | error      |
| `filler`                                       | U+115F, U+1160, U+3164, U+FFA0 (error); U+2800 (warn)                       | error/warn |
| `zero-width`                                   | U+200B-U+200D, U+2060-U+2064, U+FEFF (error); U+00AD, U+034F, U+180E (warn) | error/warn |
| `tag`                                          | U+E0000-U+E007F                                                             | error      |
| `variation-selector`                           | U+FE00-U+FE0F (warn), U+E0100-U+E01EF (error)                               | warn/error |
| `private-use`                                  | U+E000-U+F8FF and planes 15-16                                              | error      |
| `fullwidth`                                    | U+FF01-U+FF5E                                                               | warn       |
| `format`, `space`, `control`, `line-separator` | Any other `Cf`, non-ASCII `Zs`, `Zl`/`Zp`, stray `Cc`                       | error/warn |
| `general-punctuation`                          | All of U+2000-U+206F, only with `--strict`                                  | warn       |

```text
$ python3 docs/examples/unicode_scan.py src/
src/app.py:1:2: error: U+3164 HANGUL FILLER [filler] Hangul filler: blank, but a valid identifier letter
src/app.py:2:15: error: U+202E RIGHT-TO-LEFT OVERRIDE [bidi] bidirectional embedding/override (Trojan Source)
src/app.py:4:12: error: U+E000 UNNAMED [private-use] Private Use Area (no standard meaning)
src/app.py:5:9: warn: U+FF47 FULLWIDTH LATIN SMALL LETTER G [fullwidth] fullwidth ASCII lookalike (NFKC folds it)
$ echo $?
1
```

Options:

- `--strict` also flags the whole General Punctuation block (curly quotes, dashes), as some teams prefer for source code.
- `--fail-on warn` makes warnings fail the run too.

Scan everything git tracks, handling unusual file names safely:

```bash
git ls-files -z | xargs -0 python3 docs/examples/unicode_scan.py
```

## 3. Block it before commit: a git hook

[pre-commit-unicode.sh](../../examples/pre-commit-unicode.sh) scans the **staged** version of every added or modified file and blocks the commit on findings:

```bash
mkdir -p .githooks
cp docs/examples/unicode_scan.py .githooks/
cp docs/examples/pre-commit-unicode.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

```text
$ git commit -m "add helper"
src/b.py:1:2: error: U+3164 HANGUL FILLER [filler] Hangul filler: blank, but a valid identifier letter
pre-commit: suspicious Unicode found (see above). Commit blocked.
If a character is intended, write it as an escape such as é.
```

Hooks are local and can be skipped with `--no-verify`, so treat them as a convenience and enforce in CI.

## 4. Enforce in CI

A GitHub Actions job that fails any pull request introducing suspicious characters:

```yaml
name: Unicode scan
on: [pull_request]

jobs:
  unicode:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Scan tracked files
        run: git ls-files -z | xargs -0 python3 docs/examples/unicode_scan.py
```

For an existing codebase with legitimate non-ASCII text, start with the default (invisible and private-use characters only), fix or allow-list what it finds, then tighten.

## 5. Editors and code hosts

| Tool           | What to enable                                                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VS Code        | `editor.unicodeHighlight.invisibleCharacters`, `editor.unicodeHighlight.ambiguousCharacters` (on by default), `editor.renderControlCharacters`                             |
| JetBrains IDEs | The "Non-ASCII characters" inspection                                                                                                                                      |
| GitHub         | Shows a warning banner on files with bidirectional or hidden Unicode in diffs and file views                                                                               |
| Terminal       | `cat -v` and `xxd` show every byte; recent versions of `less` display format characters such as U+200B as `<U+200B>`, but Hangul fillers count as printable and stay blank |

Editors help a careful reader; they do not enforce anything. Use them together with CI.

## 6. Language and linter support

| Tool                             | Catches                                                                                                 | Misses                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| ESLint `no-irregular-whitespace` | NBSP and other odd spaces in code; zero-width in strings only with `skipStrings: false`                 | Hangul-filler identifiers, PUA strings                     |
| Rust compiler lints              | Bidi controls (deny by default), `confusable_idents`, `mixed_script_confusables`, `uncommon_codepoints` | Payloads inside string literals                            |
| GCC `-Wbidi-chars`               | Unpaired or misused bidi controls (on by default since GCC 12)                                          | Other invisible characters                                 |
| Python parser                    | Zero-width, PUA, and bidi characters in code positions                                                  | Hangul-filler identifiers; anything in strings or comments |

Tested in this repository: ESLint reported the NBSP and (with `skipStrings: false`) the zero-width space, but not a variable named with U+3164 or a string of PUA characters.

## 7. How common tools fare

These tools are often suggested for "finding hidden Unicode". Each is useful, but none is a scanner:

| Tool                                       | What it really does                                                       | Finds hidden Unicode?                                                                                                                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker compose config`                    | Parses, validates against the Compose schema, prints the resolved file    | Only in schema-checked keys (`image\u3164` is rejected). Values, commands, and environment names pass through unchanged ([4.2](02-attacks-in-source-and-config.md))                                                                                                        |
| `kubectl apply --dry-run=client -f x.yaml` | Parses the manifest and, with field validation on, rejects unknown fields | Same as Compose: unknown keys yes, values no. Pipe `-o yaml` output into a scanner to check values                                                                                                                                                                         |
| `python -m ast file.py`                    | Parses Python and prints the syntax tree                                  | Only characters that are illegal in code positions (zero-width, PUA, bidi outside strings). A file with a Hangul-filler variable, a bidi override in a string, and a PUA payload string **parses without error**. Running it on YAML fails only because YAML is not Python |
| `git diff`                                 | Shows changed lines                                                       | No: the characters are printed raw and stay invisible. Use `git diff \| cat -v`, or scan with `git grep -P` / the scanner                                                                                                                                                  |
| SIEM (for example Wazuh)                   | Matches rules against log events                                          | Not by default. Feed it scanner output (below)                                                                                                                                                                                                                             |

Verified in this repository with Python 3.14 and Docker 28.

### Feeding a SIEM such as Wazuh

Log pipelines often re-encode or escape non-ASCII text, so matching raw characters in SIEM rules is fragile. A sturdier approach is to run the scanner on a schedule and alert on its ASCII output. For Wazuh, a command monitor in the agent's `ossec.conf`:

```xml
<localfile>
  <log_format>full_command</log_format>
  <command>python3 /opt/unicode_scan/unicode_scan.py /srv/app</command>
  <alias>unicode_scan</alias>
  <frequency>3600</frequency>
</localfile>
```

and a rule on the manager (command output arrives under parent rule 530):

```xml
<group name="local,unicode_scan,">
  <rule id="100500" level="10">
    <if_sid>530</if_sid>
    <match>error: U+</match>
    <description>Suspicious invisible or private-use Unicode found by unicode_scan</description>
  </rule>
</group>
```

Rule syntax varies between Wazuh versions; check it with `wazuh-logtest` before relying on it.

## 8. Policy: decide what is allowed

Detection works best with a clear rule for what belongs in each kind of file:

| File type                      | Suggested policy                                                                                                                                          |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source code                    | ASCII only, or ASCII plus specific scripts in string literals and comments. Write intentional special characters as escapes (`"é"`) so they are visible   |
| Config (YAML, JSON, TOML, env) | No invisible, bidi, PUA, or tag characters anywhere                                                                                                       |
| Documentation and prose        | Allow letters of any script; flag invisible, bidi, PUA, and tags                                                                                          |
| User input (usernames, names)  | Normalize to NFKC, reject invisible and PUA characters, skeleton-check against existing names ([2.3](../02-tricky-unicode/03-confusables-and-scripts.md)) |
| Hostnames and URLs             | Show and log the `xn--` form; check with a homograph detector such as PunyGuard                                                                           |

## Checklist

- [ ] Scanner runs in CI on every pull request.
- [ ] Pre-commit hook installed for local feedback.
- [ ] Editor highlights invisible and ambiguous characters.
- [ ] Intentional special characters are written as escapes.
- [ ] Config is validated against a schema where one exists, and scanned where none exists.
- [ ] `exec`/`eval`/`Function`/shell calls on computed strings are treated as review hot spots.
- [ ] User-supplied identifiers are normalized and skeleton-checked.

---

Previous: [4.2 Attacks in source code and config](02-attacks-in-source-and-config.md) · Next: [5.1 Architecture](../05-how-punyguard-works/01-architecture.md)
