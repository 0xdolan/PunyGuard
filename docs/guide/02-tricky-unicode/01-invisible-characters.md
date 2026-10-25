# 2.1 Invisible and special characters

Some code points draw nothing, draw a blank, or draw something that depends entirely on the font. They are legitimate (scripts need joiners, typography needs special spaces), but they also let text contain more than it appears to. This page is a field guide to them.

**Notation:** this guide never puts these characters directly in its text. They are always written as `\uXXXX` escapes or `U+XXXX`, so what you read is what is there.

## The families at a glance

| Family                  | Code points                                           | Category  | Renders as                          | Typical abuse                                   |
| ----------------------- | ----------------------------------------------------- | --------- | ----------------------------------- | ----------------------------------------------- |
| Zero-width characters   | U+200B-U+200D, U+2060, U+FEFF                         | `Cf`      | nothing                             | Split keywords, fingerprint text, break filters |
| Bidirectional controls  | U+200E-U+200F, U+202A-U+202E, U+2066-U+2069, U+061C   | `Cf`      | nothing, but reorders text          | Trojan Source ([2.4](04-bidirectional-text.md)) |
| Unusual spaces          | U+00A0, U+2000-U+200A, U+202F, U+205F, U+3000, U+1680 | `Zs`      | a space of some width               | Look like ASCII space but compare differently   |
| Hangul fillers          | U+115F, U+1160, U+3164, U+FFA0                        | `Lo`      | blank                               | Invisible identifiers and payload bits          |
| Braille pattern blank   | U+2800                                                | `So`      | blank                               | Blank usernames and messages                    |
| Private Use Area (PUA)  | U+E000-U+F8FF, U+F0000-U+FFFFD, U+100000-U+10FFFD     | `Co`      | font-dependent: box, blank, or icon | Payload storage, font tricks                    |
| Tag characters          | U+E0000-U+E007F                                       | `Cf`      | nothing                             | Invisible copies of ASCII ("ASCII smuggling")   |
| Variation selectors     | U+FE00-U+FE0F, U+E0100-U+E01EF                        | `Mn`      | nothing (modify the previous glyph) | Attach hidden bytes to any character            |
| Fullwidth forms         | U+FF01-U+FF5E                                         | various   | wide copies of ASCII                | Lookalikes that normalize to ASCII              |
| Other format characters | U+00AD soft hyphen, U+034F, U+180E, U+2061-U+2064     | `Cf`/`Mn` | nothing                             | Same as zero-width                              |

## The General Punctuation block, U+2000-U+206F

This block is worth knowing by heart because it mixes ordinary typography with most of the invisible troublemakers:

| Range          | Contents                                                                                           | Visible?   |
| -------------- | -------------------------------------------------------------------------------------------------- | ---------- |
| U+2000-U+200A  | Spaces of different widths (en quad, em space, thin space, hair space, ...)                        | blank      |
| U+200B         | ZERO WIDTH SPACE                                                                                   | no         |
| U+200C, U+200D | ZERO WIDTH NON-JOINER, ZERO WIDTH JOINER (needed by Arabic, Indic scripts, emoji)                  | no         |
| U+200E, U+200F | LEFT-TO-RIGHT MARK, RIGHT-TO-LEFT MARK                                                             | no         |
| U+2010-U+2027  | Hyphens, dashes (including the en dash U+2013 and em dash U+2014), curly quotes, bullets, ellipsis | yes        |
| U+2028, U+2029 | LINE SEPARATOR, PARAGRAPH SEPARATOR                                                                | line break |
| U+202A-U+202E  | Bidi embeddings and overrides (LRE, RLE, PDF, LRO, RLO)                                            | no         |
| U+202F         | NARROW NO-BREAK SPACE                                                                              | blank      |
| U+2030-U+205E  | Per mille, primes, more punctuation                                                                | yes        |
| U+205F         | MEDIUM MATHEMATICAL SPACE                                                                          | blank      |
| U+2060         | WORD JOINER                                                                                        | no         |
| U+2061-U+2064  | Invisible math operators (function application, times, separator, plus)                            | no         |
| U+2066-U+2069  | Bidi isolates (LRI, RLI, FSI, PDI)                                                                 | no         |
| U+206A-U+206F  | Deprecated format characters                                                                       | no         |

Flagging the whole block (a common "custom decoder" rule) catches every invisible member, but also every curly quote and dash in normal prose. Use the full block in strict mode for source code, and the invisible subset for prose. The scanner in [4.3](../04-invisible-code/03-detection-and-defense.md) does exactly that with its `--strict` flag.

## Hangul fillers: blank letters

Korean Hangul has filler characters used when composing syllables from parts. Four of them render as empty space:

| Code point | Name                    | Block                         | UTF-8      |
| ---------- | ----------------------- | ----------------------------- | ---------- |
| U+115F     | HANGUL CHOSEONG FILLER  | Hangul Jamo                   | `E1 85 9F` |
| U+1160     | HANGUL JUNGSEONG FILLER | Hangul Jamo                   | `E1 85 A0` |
| U+3164     | HANGUL FILLER           | Hangul Compatibility Jamo     | `E3 85 A4` |
| U+FFA0     | HALFWIDTH HANGUL FILLER | Halfwidth and Fullwidth Forms | `EF BE A0` |

What makes them dangerous is their category: **`Lo`, Letter other**. To a programming language they are letters, so they are valid in identifiers:

```python
x\u3164 = 5        # a variable named "x" + HANGUL FILLER, distinct from x
print(x\u3164)     # 5
\u3164 = 1         # a variable whose whole name is invisible
```

(In a real file the escapes above are the raw characters, which is the point: you would see `x = 5` and `= 1`.) JavaScript behaves the same way: `const \u3164 = "hidden"` is valid.

Other facts worth knowing:

- NFKC normalization ([2.2](02-normalization.md)) maps both U+3164 and U+FFA0 to U+1160, which is still blank.
- The IDNA mapping for domain names drops U+3164 entirely, so `exa\u3164mple.com` resolves as `example.com`.
- They are not whitespace (`str.isspace()` is `False`, `\s` does not match) and not format characters (`\p{Cf}` does not match).
- They **are** in Unicode's `Default_Ignorable_Code_Point` property, the official list of code points that should render invisibly. That property is the best single test, covered below.

The Unicode Technical Committee has discussed the Hangul filler's problems; see https://www.unicode.org/L2/L2017/17081-hangul-filler.pdf. Character pages: https://www.compart.com/en/unicode/U+3164 and https://www.compart.com/en/unicode/U+FFA0.

## The Private Use Area

Unicode promises never to assign meaning to the PUA. Anyone can use those code points for anything, and only software that agrees on the meaning can interpret them.

| Range             | Size   | Plane |
| ----------------- | ------ | ----- |
| U+E000-U+F8FF     | 6,400  | BMP   |
| U+F0000-U+FFFFD   | 65,534 | 15    |
| U+100000-U+10FFFD | 65,534 | 16    |

Legitimate uses: icon fonts (Font Awesome, Nerd Fonts in terminals), vendor logos (Apple's fonts draw its logo at U+F8FF), and private scripts.

Why it is risky:

- How it looks depends on the installed font. The same character can be an icon on your machine, a box on mine, and nothing on a server.
- It has no standard meaning, so it is ideal for carrying data: `chr(0xE000 + byte)` stores any byte as one PUA character, and the string looks like a run of boxes or nothing.
- Python rejects PUA characters in code positions but allows them inside string literals and comments, which is exactly where a payload would go.

## Tag characters

U+E0020-U+E007E mirror printable ASCII: U+E0041 is TAG LATIN CAPITAL LETTER A. They exist for emoji subdivision flags (England's flag is a black flag followed by the tags `g b e n g` and U+E007F CANCEL TAG). Outside that use they render as nothing, so any ASCII text can be shifted into the tag range and becomes invisible:

```python
hidden = "".join(chr(0xE0000 + ord(c)) for c in "hello")
len(hidden)   # 5 code points, prints as nothing
"".join(chr(ord(c) - 0xE0000) for c in hidden)   # 'hello'
```

This has been used to smuggle instructions into text that an LLM reads but a human reviewer does not see.

## Variation selectors

Variation selectors pick a glyph variant for the previous character, for example U+FE0F asks for emoji presentation. There are 256 of them (16 in U+FE00-U+FE0F and 240 in U+E0100-U+E01EF), which is exactly one per byte value. A single visible emoji followed by a run of variation selectors still renders as one emoji, while carrying arbitrary bytes.

## Fullwidth forms, U+FF00-U+FFEF

Fullwidth forms are copies of ASCII letters, digits, and punctuation designed to occupy a full CJK character cell: `ａ` (U+FF41) instead of `a`. The block also contains halfwidth Katakana, halfwidth Hangul (including the U+FFA0 filler), and fullwidth currency signs.

Chart: https://www.unicode.org/charts/PDF/UFF00.pdf, browsable at https://unicode-explorer.com/b/FF00.

They are usually visible, but they defeat naive filters: a keyword blocklist that looks for `script` does not match `ｓｃｒｉｐｔ`. NFKC normalization folds them back to ASCII, and so does the IDNA mapping: a link to `ｇｏｏｇｌｅ.com` goes to `google.com`.

## Testing for these characters

There is no single perfect test. Combine them:

| Test                                | Catches                                                                                      | Misses                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------- |
| `\p{Default_Ignorable_Code_Point}`  | Zero-width, bidi, Hangul fillers, tags, variation selectors, soft hyphen (4,174 code points) | PUA, Braille blank, unusual spaces     |
| `\p{Cf}` (format)                   | Zero-width, bidi, tags, soft hyphen                                                          | Hangul fillers, variation selectors    |
| `\p{Co}` (private use)              | The whole PUA                                                                                | Everything else                        |
| `\p{White_Space}` minus ASCII space | NBSP, U+2000-U+200A, U+3000, line separators                                                 | Zero-width characters (not whitespace) |
| `[^\x00-\x7F]` (any non-ASCII)      | Everything, including legitimate text                                                        | Nothing, but very noisy                |

JavaScript supports all of these in regular expressions with the `u` flag:

```js
const SUSPICIOUS = /[\p{Default_Ignorable_Code_Point}\p{Co}\u2800]|[^\S\x20\t\r\n]/u;
SUSPICIOUS.test('a\u3164b'); // true  (Hangul filler)
SUSPICIOUS.test('a\ue000b'); // true  (PUA)
SUSPICIOUS.test('a\u00a0b'); // true  (no-break space)
SUSPICIOUS.test('plain text'); // false
```

Python's built-in `re` module has no `\p{...}`. Use `unicodedata` (as the scanner in [examples/unicode_scan.py](../../examples/unicode_scan.py) does) or the third-party `regex` module, which supports `\p{DI}` and `\p{Co}`.

## Try it

```bash
python3 docs/examples/invisible_codec.py "secret"
```

The middle line shows the encoded message between brackets. You should see nothing between them.

---

Previous: [1.5 Escapes and representations](../01-foundations/05-escapes-and-representations.md) · Next: [2.2 Normalization](02-normalization.md)
