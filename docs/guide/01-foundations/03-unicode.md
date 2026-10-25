# 1.3 Unicode

ASCII has 128 characters. The world's writing systems need far more. Unicode solves this with one huge numbered catalog: every character in every script gets its own number, called a **code point**.

## Code points and `U+` notation

A code point is just an integer. Unicode writes it as `U+` followed by at least four uppercase hex digits:

| Character | Code point | Decimal | Name                            |
| --------- | ---------- | ------- | ------------------------------- |
| `A`       | U+0041     | 65      | LATIN CAPITAL LETTER A          |
| `é`       | U+00E9     | 233     | LATIN SMALL LETTER E WITH ACUTE |
| `а`       | U+0430     | 1072    | CYRILLIC SMALL LETTER A         |
| `€`       | U+20AC     | 8364    | EURO SIGN                       |
| (blank)   | U+3164     | 12644   | HANGUL FILLER                   |
| `😀`      | U+1F600    | 128512  | GRINNING FACE                   |

Two things to notice:

- The first 128 code points are exactly ASCII: `A` is 65 in both.
- `a` (U+0061) and `а` (U+0430) look identical in most fonts but are different numbers. Software compares numbers, people compare shapes. Most of this guide follows from that gap.

Every code point also has an official uppercase **name**, which is the most reliable way to talk about a character you cannot see:

```python
import unicodedata
unicodedata.name("а")        # 'CYRILLIC SMALL LETTER A'
unicodedata.name("\u3164")   # 'HANGUL FILLER'
unicodedata.lookup("EURO SIGN")  # '€'
```

## The code space: planes

Code points run from U+0000 to U+10FFFF, which is 1,114,112 slots. They are divided into 17 **planes** of 65,536 each:

| Plane | Range            | Name                                 | Examples                                          |
| ----- | ---------------- | ------------------------------------ | ------------------------------------------------- |
| 0     | U+0000-U+FFFF    | Basic Multilingual Plane (BMP)       | Latin, Cyrillic, Greek, Arabic, CJK, most symbols |
| 1     | U+10000-U+1FFFF  | Supplementary Multilingual Plane     | Emoji, historic scripts, math alphanumerics       |
| 2-3   | U+20000-U+3FFFF  | Ideographic planes                   | Rare CJK ideographs                               |
| 14    | U+E0000-U+EFFFF  | Supplementary Special-purpose Plane  | Tag characters, variation selectors supplement    |
| 15-16 | U+F0000-U+10FFFF | Supplementary Private Use Areas A, B | No standard meaning                               |

Only part of this space is assigned (roughly 150,000 characters in recent versions). The rest is reserved for the future.

## Blocks

Within a plane, characters are grouped into **blocks**: contiguous ranges with a theme. Blocks are a quick way to spot "this character comes from somewhere unusual":

| Block                             | Range           | Why it matters for security                               |
| --------------------------------- | --------------- | --------------------------------------------------------- |
| Basic Latin                       | U+0000-U+007F   | ASCII                                                     |
| Cyrillic                          | U+0400-U+04FF   | Many letters identical to Latin (`а е о р с х у і`)       |
| Greek and Coptic                  | U+0370-U+03FF   | `ο α ν ρ` and capitals like `Α Β Ε Η Ι Κ Μ Ν Ο Ρ Τ Χ`     |
| General Punctuation               | U+2000-U+206F   | Odd spaces, zero-width characters, bidi controls          |
| Hangul Compatibility Jamo         | U+3130-U+318F   | Contains U+3164 HANGUL FILLER, a blank letter             |
| Private Use Area                  | U+E000-U+F8FF   | Meaning is private to whoever uses it                     |
| Halfwidth and Fullwidth Forms     | U+FF00-U+FFEF   | Fullwidth copies of ASCII (`ａ`), U+FFA0 halfwidth filler |
| Mathematical Alphanumeric Symbols | U+1D400-U+1D7FF | Styled letters (`𝗮 𝐚 𝒂`) that NFKC folds to plain ASCII   |
| Tags                              | U+E0000-U+E007F | Invisible copies of ASCII                                 |

Official charts for every block are at https://www.unicode.org/charts/ (for example, the Halfwidth and Fullwidth Forms chart is https://www.unicode.org/charts/PDF/UFF00.pdf). Browsable views: https://unicode-explorer.com/b/FF00 and https://www.compart.com/en/unicode/U+3164.

## Properties: category and script

Each code point carries properties. The two PunyGuard uses most:

**General category**, a two-letter code for what kind of character it is:

| Category  | Meaning                 | Example                                                |
| --------- | ----------------------- | ------------------------------------------------------ |
| `Lu`/`Ll` | Letter, upper/lowercase | `A`, `a`, `а`                                          |
| `Lo`      | Letter, other           | `例`, and also U+3164 HANGUL FILLER                    |
| `Mn`      | Mark, nonspacing        | U+0301 combining acute accent, variation selectors     |
| `Nd`      | Decimal digit           | `7`, `٧` (Arabic-Indic seven)                          |
| `Zs`      | Space separator         | U+0020 space, U+00A0 no-break space                    |
| `Cc`      | Control                 | tab, line feed, U+0000                                 |
| `Cf`      | Format                  | U+200B zero-width space, U+202E right-to-left override |
| `Co`      | Private use             | U+E000                                                 |
| `Cn`      | Unassigned              | U+0378                                                 |

```python
unicodedata.category("a")        # 'Ll'
unicodedata.category("\u200b")   # 'Cf'
unicodedata.category("\u3164")   # 'Lo'  a "letter" that renders as nothing
unicodedata.category("\ue000")   # 'Co'
```

Notice the trap: the Hangul filler is a **letter**, not a format or space character. A filter that only removes `Cf` and `Zs` characters lets it through. [Section 2.1](../02-tricky-unicode/01-invisible-characters.md) covers this in depth.

**Script**, the writing system a character belongs to (Latin, Cyrillic, Greek, Han, ...). Python's standard library does not expose it; PunyGuard uses the `unicode-properties` package, and the third-party Python `regex` module supports `\p{Script=Cyrillic}`. Mixing scripts inside one word is a strong spoofing signal, covered in [2.3](../02-tricky-unicode/03-confusables-and-scripts.md).

## Characters, code points, and graphemes

"Character" is ambiguous. Three different things get that name:

| Term             | Meaning                                     | `é` written as `e` + U+0301 | Family emoji (man, woman, girl joined by U+200D) |
| ---------------- | ------------------------------------------- | --------------------------- | ------------------------------------------------ |
| Code point       | One Unicode number                          | 2                           | 5 (three people joined by two U+200D)            |
| Grapheme cluster | What a reader perceives as one character    | 1                           | 1                                                |
| Code unit        | One storage unit of an encoding (next page) | depends on the encoding     | 8 in UTF-16, 18 in UTF-8                         |

Keep this table in mind: "how long is this string?" has three correct answers, and attackers rely on tools that pick the wrong one.

## Try it

```python
import unicodedata
for ch in "pаypal":
    print(f"U+{ord(ch):04X}", unicodedata.name(ch))
```

One line says `CYRILLIC SMALL LETTER A`. That one character is the whole attack in [3.3](../03-domains/03-homograph-attacks.md).

---

Previous: [1.2 ASCII](02-ascii.md) · Next: [1.4 Encoding and decoding](04-encoding-and-decoding.md)
