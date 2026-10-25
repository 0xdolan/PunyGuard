# 3.2 IDN and Punycode

DNS itself only carries ASCII labels ([3.1](01-domain-names.md)). **Internationalized Domain Names (IDN)** let people use names like `münchen.de` or `例え.jp` anyway, by translating each non-ASCII label into an ASCII form that DNS can carry.

## Two forms of every label

| Form    | Also called     | Example          | Used by                               |
| ------- | --------------- | ---------------- | ------------------------------------- |
| U-label | Unicode form    | `münchen`        | People, address bar display           |
| A-label | ASCII form, ACE | `xn--mnchen-3ya` | DNS, certificates, HTTP `Host` header |

An A-label is the prefix `xn--` (the **ACE prefix**, ASCII Compatible Encoding) followed by the label encoded with **Punycode** (RFC 3492). ASCII-only labels are left alone, so a hostname can mix both: `xn--mnchen-3ya.de`.

```python
"münchen.de".encode("idna")             # b'xn--mnchen-3ya.de'
b"xn--80ak6aa92e.com".decode("idna")    # 'аррӏе.com'  (all Cyrillic)
"münchen".encode("punycode")            # b'mnchen-3ya'  (Punycode only, no prefix)
```

```js
new URL('https://münchen.de/').hostname; // 'xn--mnchen-3ya.de'
```

## The pipeline: mapping, then encoding

Turning what a user typed into an A-label happens in two stages:

```text
user input  ->  UTS #46 mapping  ->  validation  ->  Punycode per label  ->  xn--...
"ＭÜＮＣＨＥＮ.de"  "münchen.de"       (rules pass)      "mnchen-3ya"           "xn--mnchen-3ya.de"
```

**1. Mapping (UTS #46, https://www.unicode.org/reports/tr46/).** Lowercase, apply compatibility mappings (fullwidth to ASCII, many NFKC folds), and remove characters that should be ignored. This is why `ｇｏｏｇｌｅ.com` maps to plain `google.com` and why `exa\u3164mple.com` (with a Hangul filler) maps to `example.com`.

**2. Validation (IDNA2008, RFCs 5890-5894).** Reject labels that use disallowed code points (most symbols, bidi controls, the Private Use Area), break the bidi rule, or are otherwise malformed. A string that fails validation cannot be converted at all, which is itself a useful signal.

**3. Punycode.** Encode each remaining non-ASCII label and add `xn--`.

### Transitional versus nontransitional

IDNA2003 and IDNA2008 disagree on a few characters, most famously `ß`:

| Input    | IDNA2003 / transitional | IDNA2008 / nontransitional |
| -------- | ----------------------- | -------------------------- |
| `faß.de` | `fass.de`               | `xn--fa-hia.de`            |

Python's built-in `idna` codec implements the old IDNA2003 rules (`"faß.de".encode("idna")` gives `b'fass.de'`); the third-party `idna` package implements IDNA2008. Modern browsers and PunyGuard use **nontransitional** UTS #46 processing, so `faß.de` stays a distinct name.

## How Punycode works

Punycode is an instance of an algorithm called **Bootstring**. Its goal is a compact, reversible ASCII encoding that keeps any ASCII letters readable.

The output has two parts:

```text
mnchen-3ya
^^^^^^ ^^^
basic  encoded insertions
```

1. Copy all ASCII characters of the label, in order: `mnchen`. If there were any, add a `-`.
2. Encode the non-ASCII characters as a series of **insertions**: "insert code point N at position P". Each insertion is turned into one number, `delta`, which is written as a variable-length base-36 number using `a`-`z` (0-25) and `0`-`9` (26-35).

### Worked example: `münchen`

Parameters from RFC 3492: base 36, tmin 1, tmax 26, initial n = 128, initial bias = 72.

```text
basic code points:  m n c h e n   (6 of them)  -> output "mnchen-"
non-ASCII:          ü = U+00FC = 252, inserted at position 1

delta starts at (252 - 128) * (6 + 1) = 868
walk the label "m ü n c h e n":
  'm' (109 < 252)  -> delta = 869
  'ü' (== 252)     -> encode delta 869 now

encode 869 as a variable-length integer, bias 72:
  k = 36:  threshold t = clamp(36 - 72) = 1
           digit = 1 + (869 - 1) % (36 - 1) = 1 + 28 = 29 -> '3'
           q = (869 - 1) // 35 = 24
  k = 72:  t = clamp(72 - 72) = 1
           digit = 1 + (24 - 1) % 35 = 24 -> 'y'
           q = (24 - 1) // 35 = 0
  k = 108: t = clamp(108 - 72) = 26
           q = 0 < t, so the last digit is 0 -> 'a'

output: "mnchen-" + "3ya" = "mnchen-3ya"   then add the prefix: "xn--mnchen-3ya"
```

(`clamp` keeps t between tmin = 1 and tmax = 26.) Decoding runs the same steps in reverse. You never need to do this by hand, but seeing it once makes clear that Punycode is a deterministic encoding, not encryption or hashing.

### Why every lookalike has a unique A-label

Because Punycode encodes exact code points, different Unicode strings always produce different A-labels, even if they look identical:

| Displayed    | Actual code points         | A-label              |
| ------------ | -------------------------- | -------------------- |
| `paypal.com` | all Latin                  | `paypal.com`         |
| `pаypal.com` | Cyrillic `а` in position 2 | `xn--pypal-4ve.com`  |
| `аррӏе.com`  | all Cyrillic               | `xn--80ak6aa92e.com` |
| `gооgle.com` | two Cyrillic `о`           | `xn--ggle-55da.com`  |

This is the key fact behind homograph detection: **the A-label never lies**. Two names that look the same in a browser are different names in DNS, and the `xn--` form shows it. Notice how `pаypal` keeps its ASCII letters (`pypal`) and then encodes the one Cyrillic insertion (`4ve`).

## Reading `xn--` labels in the wild

An `xn--` label is not suspicious by itself; millions of legitimate sites use IDNs (`xn--mnchen-3ya.de`, `xn--r8jz45g.jp` for `例え.jp`). What matters is what the U-label looks like and which scripts it uses. That is what [3.3](03-homograph-attacks.md) and PunyGuard's engine ([5.2](../05-how-punyguard-works/02-domain-detection-pipeline.md)) examine.

## Try it

```python
for host in ["münchen.de", "pаypal.com", "аррӏе.com", "ｇｏｏｇｌｅ.com"]:
    print(host, "->", host.encode("idna").decode())
```

Then decode the hostname from the very first bug report this project fixed: `xn--mzn-5cdb9f.com`. What does it spell, and which letters are not Latin?

---

Previous: [3.1 How domain names work](01-domain-names.md) · Next: [3.3 Homograph attacks](03-homograph-attacks.md)
