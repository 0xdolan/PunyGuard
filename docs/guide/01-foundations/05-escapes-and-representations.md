# 1.5 Escapes and representations

An **escape** writes a character using only safe, visible ASCII. Escapes are how you put a character into a context that cannot hold it directly, and they are how you make an invisible character visible during review.

The same character, U+3164 HANGUL FILLER, written in every common syntax:

| Context           | Syntax                            | U+3164                          | `é` (U+00E9) | `😀` (U+1F600)                  |
| ----------------- | --------------------------------- | ------------------------------- | ------------ | ------------------------------- |
| Unicode notation  | `U+XXXX`                          | `U+3164`                        | `U+00E9`     | `U+1F600`                       |
| HTML (hex)        | `&#xXXXX;`                        | `&#x3164;`                      | `&#xE9;`     | `&#x1F600;`                     |
| HTML (decimal)    | `&#NNNN;`                         | `&#12644;`                      | `&#233;`     | `&#128512;`                     |
| URL (percent)     | `%XX` per UTF-8 byte              | `%E3%85%A4`                     | `%C3%A9`     | `%F0%9F%98%80`                  |
| JavaScript / JSON | `\uXXXX`                          | `\u3164`                        | `é`          | `😀` (JSON) or `\u{1F600}` (JS) |
| Python            | `\uXXXX`, `\UXXXXXXXX`, `\N{...}` | `\u3164` or `\N{HANGUL FILLER}` | `\xe9`       | `\U0001F600`                    |
| CSS               | `\XXXX `                          | `\3164 `                        | `\e9 `       | `\1F600 `                       |
| UTF-8 bytes (hex) | raw bytes                         | `E3 85 A4`                      | `C3 A9`      | `F0 9F 98 80`                   |

Notes:

- **URL encoding works on bytes**, not code points: it first encodes to UTF-8, then writes each byte as `%XX`. That is why one character becomes three escapes.
- **JSON only has `\uXXXX`**, so characters above U+FFFF are written as a surrogate pair.
- **JavaScript** accepts both `😀` and `\u{1F600}` and they produce the same string.

## Escapes in code

```python
import html, urllib.parse, json

html.unescape("&#x3164;") == "\u3164"         # True
urllib.parse.quote("münchen")                  # 'm%C3%BCnchen'
urllib.parse.unquote("%E3%85%A4") == "\u3164"  # True
json.dumps("é\u3164")                          # '"\\u00e9\\u3164"'  (ASCII-safe by default)
json.dumps("é\u3164", ensure_ascii=False)      # '"é<U+3164>"'  raw characters; the filler prints as blank
"\N{HANGUL FILLER}" == "\u3164"               # True
```

## Making the invisible visible

Not every "show me the string" function reveals hidden characters:

```python
repr("\u200b")    # "'\\u200b'"  escaped, visible
repr("\u3164")    # "'<U+3164>'"  NOT escaped (shown here as <U+3164>): Python considers it printable
ascii("\u3164")   # "'\\u3164'"  always escapes non-ASCII
ascii("pаypal")   # "'p\\u0430ypal'"  reveals the Cyrillic a
```

```js
JSON.stringify('\u200b'); // '"<U+200B>"'  the raw zero-width space, still invisible
// Reveal everything outside printable ASCII:
const reveal = (s) =>
  [...s].map((c) => (/[\x20-\x7e]/.test(c) ? c : `\\u{${c.codePointAt(0).toString(16)}}`)).join('');
reveal('pаypal'); // 'p\\u{430}ypal'
```

**Rule of thumb:** when reviewing untrusted text, use a function that escapes everything outside printable ASCII (`ascii()` in Python, a custom `reveal` in JavaScript, `cat -v` or `xxd` in a shell). Do not trust `repr()`, `print()`, `console.log()`, or your editor to show you what is there.

```bash
printf 'x\u3164 = 1\n' | cat -v   # xM-cM-^EM-$ = 1   (the three UTF-8 bytes, made visible)
printf 'x\u3164 = 1\n' | xxd      # 00000000: 78e3 85a4 203d 2031 0a
```

## How long is a string?

Section [1.3](03-unicode.md) showed that "character" has three meanings. Each language picks one for `length`:

| Expression                               | `"e\u0301"` (é decomposed) | `"😀"` | family emoji |
| ---------------------------------------- | -------------------------- | ------ | ------------ |
| Python `len()` (code points)             | 2                          | 1      | 5            |
| JavaScript `.length` (UTF-16 code units) | 2                          | 2      | 8            |
| JavaScript `[...s].length` (code points) | 2                          | 1      | 5            |
| `Intl.Segmenter` (graphemes)             | 1                          | 1      | 1            |
| UTF-8 bytes                              | 3                          | 4      | 18           |

Why this matters for security:

- A length limit counted in one unit can be bypassed in another.
- Two strings that render identically can compare as unequal: `"e\u0301" == "é"` is `False` until you normalize ([2.2](../02-tricky-unicode/02-normalization.md)).
- Truncating a UTF-16 string by code units can split a surrogate pair and produce invalid text.

## Try it

1. In Python, compare `print(repr("\u3164"))` with `print(ascii("\u3164"))`. Which would you trust in a code review?
2. URL-encode `аррӏе.com` with `urllib.parse.quote`. How many `%` escapes do you get, and why?

---

Previous: [1.4 Encoding and decoding](04-encoding-and-decoding.md) · Next: [2.1 Invisible and special characters](../02-tricky-unicode/01-invisible-characters.md)
