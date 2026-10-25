# 5.3 Character inspector

The inspector (popup **Inspect** tab, the full-page analyzer, and https://0xdolan.github.io/PunyGuard/#/inspect) breaks any hostname or string into code points and shows everything from sections 1 and 2 about each one. It is built on `analyzeDomainCharacters` and `analyzeCodePoint` in [characters.ts](../../../packages/core/src/characters.ts).

## What you see

For an input like `xn--mzn-5cdb9f.com`:

1. **Domain verdict**: level, score, and reasons from the pipeline in [5.2](02-domain-detection-pipeline.md).
2. **IDN card**: the Unicode and `xn--` forms side by side, with each label's conversion.
3. **Character table**: one row per code point, sortable and filterable by every column.
4. **Details drawer**: everything known about one character.

## Fields per character

| Field           | How it is computed                                                               | Example for `а` (U+0430)  |
| --------------- | -------------------------------------------------------------------------------- | ------------------------- |
| Glyph           | The character itself; invisible ones are drawn as `·` and spaces as `␣`          | `а`                       |
| `U+` code point | Hex, zero-padded to 4 (or 5 above U+FFFF) digits                                 | `U+0430`                  |
| Decimal         | The code point as a number                                                       | `1072`                    |
| Name            | Official Unicode name from a compact name table                                  | `CYRILLIC SMALL LETTER A` |
| Block           | Block containing the code point                                                  | `Cyrillic`                |
| Script          | From the `unicode-properties` package                                            | `Cyrillic`                |
| Category        | General category and its label                                                   | `Ll` (Letter, lowercase)  |
| Combining class | Canonical combining class (non-zero for combining marks)                         | `0`                       |
| Bidi            | Simplified: bidi control, right-to-left (Arabic/Hebrew script), or left-to-right | `L`                       |
| HTML escape     | `&#xHEX;`                                                                        | `&#x430;`                 |
| URL escape      | `encodeURIComponent` (percent-encoded UTF-8)                                     | `%D0%B0`                  |
| JS escape       | `\uXXXX`, or `\u{XXXXX}` above U+FFFF                                            | `а`                       |
| UTF-8           | Bytes from `TextEncoder`                                                         | `D0 B0`                   |
| UTF-16          | Code unit(s), surrogate pair above U+FFFF                                        | `0430`                    |
| Links           | Unicode's character page and the block's chart PDF                               |                           |

All of these representations are explained in [1.4](../01-foundations/04-encoding-and-decoding.md) and [1.5](../01-foundations/05-escapes-and-representations.md).

## Flags

Each row carries flags that the table's **Flags** filter can select:

| Flag                      | Rule                                                                                                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Homoglyph**             | The code point is in the confusables table and maps to a different character ([5.2](02-domain-detection-pipeline.md))                                                                                     |
| **Invisible**             | Category `Cc`, `Cf`, `Zl`, or `Zp`; any `Zs` other than U+0020; or one of a fixed list: U+00AD, U+034F, U+061C, U+180E, U+200B-U+200F, U+202A-U+202E, U+2060-U+2064, U+2066-U+2069, U+FEFF, U+FFF9-U+FFFB |
| **Control**               | Category `Cc` (and not already flagged invisible)                                                                                                                                                         |
| **ASCII** / **Non-ASCII** | Code point below or above U+007F                                                                                                                                                                          |

The domain-level report also counts invisible, homoglyph, non-ASCII, and control characters.

## Search

The search box matches any of: the character, its `U+` code, hex, decimal, name, block, script, category, escapes, UTF-8 bytes, and the words `invisible` or `homoglyph` for flagged rows. So `cyrillic`, `u+0430`, `430`, `d0 b0`, and `homoglyph` all find the same row.

## Using it to investigate

1. Paste a suspicious link or hostname.
2. Read the verdict and the IDN card: is there an `xn--` form, and what does it decode to?
3. Filter the table by **Non-ASCII**. Each remaining row is a character that is not what it looks like.
4. Check the **Script** column for mixing, and the **Homoglyph** flag for lookalikes.
5. Copy the list (`U+XXXX NAME` per line) into a report or ticket.

---

Previous: [5.2 Domain detection pipeline](02-domain-detection-pipeline.md) · Next: [5.4 Limitations and roadmap](04-limitations-and-roadmap.md)
