# 2.3 Confusables and scripts

A **confusable** (or **homoglyph**) is a character that looks like another character. Unicode publishes the official list and the algorithms for using it in [UTS #39, Unicode Security Mechanisms](https://www.unicode.org/reports/tr39/). This page explains the three ideas from UTS #39 that PunyGuard is built on: confusables, skeletons, and script mixing.

## Confusables

The most dangerous confusables are letters from other alphabets that are pixel-identical to Latin letters in common fonts:

| Looks like | Latin  | Cyrillic            | Greek              | Other                          |
| ---------- | ------ | ------------------- | ------------------ | ------------------------------ |
| a          | U+0061 | `а` U+0430          | `α` U+03B1 (close) |                                |
| c          | U+0063 | `с` U+0441          |                    |                                |
| e          | U+0065 | `е` U+0435          |                    |                                |
| i          | U+0069 | `і` U+0456          |                    | `ı` U+0131 dotless i (Latin)   |
| l          | U+006C | `ӏ` U+04CF palochka |                    | `1` digit, `I` capital i       |
| o          | U+006F | `о` U+043E          | `ο` U+03BF         | `օ` U+0585 Armenian, `0` digit |
| p          | U+0070 | `р` U+0440          | `ρ` U+03C1 (close) |                                |
| x          | U+0078 | `х` U+0445          | `χ` U+03C7 (close) |                                |
| y          | U+0079 | `у` U+0443          |                    |                                |
| A          | U+0041 | `А` U+0410          | `Α` U+0391         |                                |
| H          | U+0048 | `Н` U+041D          | `Η` U+0397         |                                |

There are also **multi-character** confusables, which no per-character check can see: `rn` looks like `m`, `vv` like `w`, `cl` like `d`.

And there are **same-script** lookalikes that have nothing to do with Unicode: `l`/`1`/`I`, `O`/`0`. These are why `paypa1.com` works as a phishing domain even in pure ASCII.

## Skeletons

Comparing every pair of strings for visual similarity is impractical. UTS #39 instead defines a **skeleton**: map every character to a representative of its confusable group, so that two strings are confusable when their skeletons are equal.

```text
skeleton(X):
  1. Convert X to NFD
  2. Replace each character with its prototype from confusables.txt
  3. Convert to NFD again
```

Examples:

| Input          | Characters           | Skeleton |
| -------------- | -------------------- | -------- |
| `paypal`       | all Latin            | `paypal` |
| `pаypal`       | Latin + Cyrillic `а` | `paypal` |
| `аррӏе`        | all Cyrillic         | `apple`  |
| `ｐａｙｐａｌ` | fullwidth Latin      | `paypal` |

If a domain's skeleton equals a well-known domain's name but the domain itself is different, that is a strong phishing signal. PunyGuard computes a skeleton for every hostname label; [5.2](../05-how-punyguard-works/02-domain-detection-pipeline.md) shows its exact table and how the skeleton feeds the score.

The full mapping file is https://www.unicode.org/Public/security/latest/confusables.txt.

## Scripts and mixed-script detection

Every character belongs to a **script**: Latin, Cyrillic, Greek, Han, Arabic, and so on. Some characters are shared by all scripts and belong to **Common** (digits, most punctuation, the hyphen) or **Inherited** (combining marks take the script of their base letter).

Real words are almost always written in one script. A label that mixes scripts, such as Latin and Cyrillic in `pаypal`, is either a typo-level accident or an attack:

```python
# Script of each letter in "pаypal"
# p  Latin
# а  Cyrillic   <- the odd one out
# y  Latin
# p  Latin
# a  Latin
# l  Latin
```

### Legitimate mixing

Some languages mix scripts by design. UTS #39 handles this with **augmented script sets**:

| Language | Scripts used together     | Example                 |
| -------- | ------------------------- | ----------------------- |
| Japanese | Han + Hiragana + Katakana | `例え.jp`, `東京タワー` |
| Korean   | Han + Hangul              |                         |
| Chinese  | Han + Bopomofo            |                         |

A good mixed-script check treats Han+Hiragana as one script set for Japanese, not as a red flag. (PunyGuard does not do this yet; see [5.4](../05-how-punyguard-works/04-limitations-and-roadmap.md).)

### Whole-script confusables

Mixed-script detection has a blind spot: a label written **entirely** in one other script. `аррӏе` is 100% Cyrillic, so it is single-script and passes a mixed-script check, yet it looks exactly like `apple`. UTS #39 calls this a **whole-script confusable**. The only defense is the skeleton: `skeleton("аррӏе") == "apple"`.

## Restriction levels

UTS #39 defines how strict an identifier policy can be:

| Level                  | Allows                                                               |
| ---------------------- | -------------------------------------------------------------------- |
| ASCII-Only             | Only ASCII                                                           |
| Single Script          | One script (plus Common/Inherited)                                   |
| Highly Restrictive     | One script, or an approved combination such as Han+Hiragana+Katakana |
| Moderately Restrictive | Also Latin plus one other script, except Cyrillic and Greek          |
| Minimally Restrictive  | Any mix, as long as each character is allowed in identifiers         |
| Unrestricted           | Anything                                                             |

Browsers use rules close to "Moderately Restrictive" when deciding whether to show a domain in Unicode or as Punycode ([3.3](../03-domains/03-homograph-attacks.md)). Note that Latin + Cyrillic is excluded from every level above Minimally Restrictive, because those two scripts share so many identical letters.

## Try it

Find the odd character without trusting your eyes:

```python
import unicodedata
s = "аpple.com"
print([(c, unicodedata.name(c).split()[0]) for c in s if c.isalpha()])
```

---

Previous: [2.2 Normalization](02-normalization.md) · Next: [2.4 Bidirectional text](04-bidirectional-text.md)
