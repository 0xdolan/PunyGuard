# 2.2 Normalization

Unicode often has more than one way to write what is meant to be the same text. **Normalization** converts text to a single canonical form so that comparisons, searches, and lookups behave. It is also a security tool: many filter bypasses work because one component normalizes and another does not.

## Two kinds of "same"

**Canonical equivalence**: different code points that are exactly the same character.

```text
é  = U+00E9                      (precomposed: one code point)
é  = U+0065 U+0301               (decomposed: e + COMBINING ACUTE ACCENT)
Å  = U+00C5  and  U+212B ANGSTROM SIGN
K  = U+004B  and  U+212A KELVIN SIGN
```

**Compatibility equivalence**: characters that mean the same thing but differ in presentation.

```text
ｐａｙｐａｌ  (fullwidth)         ~ paypal
𝗽𝗮𝘆𝗽𝗮𝗹  (math sans-serif bold) ~ paypal
ﬁ  (U+FB01 ligature)             ~ fi
①  (circled digit one)           ~ 1
x²                               ~ x2
™                                ~ TM
```

## The four normalization forms

| Form | Decompose using | Then recompose? | Use it for                                      |
| ---- | --------------- | --------------- | ----------------------------------------------- |
| NFD  | canonical       | no              | Stripping accents, linguistic processing        |
| NFC  | canonical       | yes             | Storing and exchanging text (the web's default) |
| NFKD | compatibility   | no              | Search indexes                                  |
| NFKC | compatibility   | yes             | Identifiers, usernames, security comparisons    |

```python
import unicodedata as u

u.normalize("NFC", "é") == "é"   # True  canonical
u.normalize("NFD", "é")                # 'e' + U+0301
u.normalize("NFKC", "ｐａｙｐａｌ")          # 'paypal'
u.normalize("NFKC", "𝗽𝗮𝘆𝗽𝗮𝗹")             # 'paypal'
u.normalize("NFKC", "ﬁ ① ™")               # 'fi 1 TM'
u.normalize("NFC", "K") == "K"        # True: KELVIN SIGN becomes K
```

```js
'é'.normalize('NFC') === 'é'; // true
'ｐａｙｐａｌ'.normalize('NFKC'); // 'paypal'
```

## What normalization does not do

This is the most important part of the page:

```python
u.normalize("NFKC", "pаypal") == "paypal"   # False: the Cyrillic а stays Cyrillic
```

**NFKC does not map lookalikes across scripts.** Cyrillic `а` (U+0430) and Latin `a` (U+0061) are different letters of different alphabets, not two presentations of one letter, so no normalization form merges them. Catching those needs a confusables table and a skeleton, covered in [2.3](03-confusables-and-scripts.md).

Normalization also does not remove most invisible characters: NFKC leaves U+200B in place and turns U+3164 HANGUL FILLER into U+1160 HANGUL JUNGSEONG FILLER, which is still blank.

## Case folding

Case-insensitive comparison needs **case folding**, not `lower()`:

```python
"Straße".lower()                                 # 'straße'
"Straße".casefold()                              # 'strasse'
"STRASSE".casefold() == "Straße".casefold()      # True
```

Some case mappings change length, and some depend on the language (Turkish dotted and dotless i). For identifiers, the robust recipe is NFKC, then case fold, then NFKC again (Unicode calls this NFKC_Casefold).

## Where normalization happens automatically

| Where                         | What it does                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Python identifiers            | NFKC-normalized by the parser: `ｘ = 1` defines `x` (PEP 3131)                                               |
| Domain names (IDNA / UTS #46) | Maps to lowercase, applies NFKC-like mapping, drops some invisibles: `ｇｏｏｇｌｅ.com` becomes `google.com` |
| macOS file names (HFS+)       | Stored decomposed (NFD-like)                                                                                 |
| Most web forms, databases     | Nothing, unless the application normalizes                                                                   |

## Normalization as a vulnerability

The classic bug: validate first, normalize later.

```text
1. Filter checks the input for "<script>"      -> "＜script＞" passes (fullwidth brackets)
2. Later, something applies NFKC               -> "<script>"
```

Rules:

1. Normalize **first**, then validate, then store or compare.
2. Use the same form everywhere the same data is compared.
3. Remember that normalization fixes presentation variants, not cross-script lookalikes and not most invisible characters.

## Try it

```python
import unicodedata as u
for s in ["ｐａｙｐａｌ", "pаypal", "x\u3164y"]:
    print(ascii(s), "->", ascii(u.normalize("NFKC", s)))
```

Which input becomes plain ASCII, which keeps a Cyrillic letter, and which still contains a blank character?

---

Previous: [2.1 Invisible and special characters](01-invisible-characters.md) · Next: [2.3 Confusables and scripts](03-confusables-and-scripts.md)
