# 5.2 Domain detection pipeline

This page follows one hostname through `analyzeHostname` in [packages/core/src/analyze.ts](../../../packages/core/src/analyze.ts), step by step, and ends with real output from the engine for a set of examples.

## Overview

```text
raw input ──► normalize ──► split labels ──► IDNA convert ──► score each label ──► hostname bonuses ──► level
"HTTPS://Xn--Mzn-5cdb9f.com:443/x"                                                                   "danger"
```

## Step 1: normalize the hostname

`normalizeHostname` in [domain.ts](../../../packages/core/src/domain.ts):

1. Trim and lowercase.
2. If it is a URL, take `new URL(input).hostname`; if it has a path, cut it off.
3. Remove a port (`:8443`) and a trailing dot.
4. Reject IPv4 and IPv6 literals (they cannot be homographs).
5. Reject anything over 253 characters or not shaped like `label.label...`, where a label is letters, marks, digits, format characters (`\p{Cf}`, kept on purpose so invisible characters can be detected), `_`, and `-`.

```text
"HTTPS://Example.COM:8443/path"  -> "example.com"
"192.168.0.1"                    -> rejected
"localhost"                      -> rejected (one label)
```

## Step 2: split into labels

`deconstructDomain` splits on dots and finds the public suffix using a built-in list of common multi-part suffixes (`co.uk`, `com.au`, `github.io`, and others), giving the SLD and registrable domain ([3.1](../03-domains/01-domain-names.md)).

## Step 3: IDNA conversion

`convertIdn` in [idn.ts](../../../packages/core/src/idn.ts) runs UTS #46 in **nontransitional** mode with STD3 ASCII rules and DNS length checks, in both directions:

| Field     | Meaning                                 | For `xn--mzn-5cdb9f.com` |
| --------- | --------------------------------------- | ------------------------ |
| `ascii`   | A-label form (what DNS sees)            | `xn--mzn-5cdb9f.com`     |
| `unicode` | U-label form (what a person would read) | `аmаzоn.com`             |
| `hasIdn`  | Any `xn--` label or any non-ASCII       | true                     |
| `errors`  | IDNA validation failures                | none                     |

The mapping step means some inputs change before scoring: `ｇｏｏｇｌｅ.com` becomes `google.com` and a Hangul filler inside a label is dropped ([3.2](../03-domains/02-idn-and-punycode.md)). That matches what the browser would actually connect to.

**IDNA failure: +20.** If conversion fails (for example a bidi control in the label), the hostname gets 20 points and the reason `IDNA validation: ...`.

## Step 4: score each label

Every label of the Unicode hostname is scored on its own by `scoreLabel`, and the label scores are added.

### 4a. Skeleton and homoglyph count

`skeletonize` looks up each character in `CONFUSABLE_TO_LATIN` ([confusables.ts](../../../packages/core/src/confusables.ts)), a curated table inspired by UTS #39 with 153 entries:

- Cyrillic letters that look Latin: `а е о р с у х і ї һ ԁ ԛ ԝ в к м н т з ө` and capitals `А Е О Р С Х І В К М Н Т`
- Greek letters that look Latin (`α ο ρ τ υ χ ν` and capitals)
- Miscellaneous lookalikes: `ð ơ ɡ ı ȷ` and Armenian `ո հ ք զ`
- Fullwidth `Ａ-Ｚ`, `ａ-ｚ`, `０-９`
- A run of mathematical alphanumeric letters

Each mapped character is replaced by its Latin lookalike and counted as a homoglyph. ASCII is lowercased; anything else is kept as is.

```text
"аmаzоn"  ->  skeleton "amazon", 3 homoglyphs (а, а, о)
```

### 4b. Scripts

`scriptBitForCodePoint` assigns each character to a script family by code point range (Latin, Cyrillic, Greek, Arabic, Hebrew, Han, Hangul, Hiragana, Katakana, Thai, Devanagari, Armenian, or Other). Digits and hyphens are ignored. A label with two or more named scripts is **mixed-script**.

### 4c. Label points

| Signal                                                                              | Points                   | Reason text                                    |
| ----------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------- |
| Label is an IDN (`xn--` or non-ASCII)                                               | +25                      | `Punycode / IDN (ACE xn--) label present`      |
| Homoglyphs found                                                                    | +min(40, 15 + 8 x count) | `Homoglyph characters detected (n)`            |
| Two or more scripts                                                                 | +35                      | `Mixed scripts: Latin + Cyrillic`              |
| Zero-width or bidi characters (U+200B-U+200F, U+202A-U+202E, U+2060-U+206F, U+FEFF) | +50                      | `Invisible / bidirectional control characters` |
| Over 40% non-ASCII and not mixed-script                                             | +10                      | `High non-ASCII density`                       |

The density signal exists for whole-script lookalikes like `аррӏе`, which are single-script and would otherwise get no mixed-script points.

## Step 5: hostname-level signals

| Signal                                                                | Points | Reason text                                    |
| --------------------------------------------------------------------- | ------ | ---------------------------------------------- |
| Homoglyphs found and the SLD skeleton is plain ASCII, at least 3 long | +15    | `ASCII skeleton: "amazon"`                     |
| IDN whose A-label differs from its U-label                            | 0      | `ACE form: xn--mzn-5cdb9f.com` (informational) |

The skeleton bonus captures the strongest signal of all: the name _becomes a normal ASCII word_ once lookalikes are replaced, which is exactly what a spoof is designed to do.

## Step 6: level

The score is capped at 100, then:

| Level      | Condition                                                            |
| ---------- | -------------------------------------------------------------------- |
| **danger** | score >= 55, **or** mixed-script **and** homoglyphs                  |
| **watch**  | otherwise, score >= 20, or any IDN, homoglyph, or mixed-script label |
| **safe**   | none of the above (reason: `No homograph indicators`)                |

## Worked examples (real engine output)

| Input                | Unicode form | A-label              | Level  | Score | Why                                                    |
| -------------------- | ------------ | -------------------- | ------ | ----- | ------------------------------------------------------ |
| `paypal.com`         | `paypal.com` | `paypal.com`         | safe   | 0     | No homograph indicators                                |
| `xn--mzn-5cdb9f.com` | `аmаzоn.com` | `xn--mzn-5cdb9f.com` | danger | 100   | IDN, 3 homoglyphs, Latin + Cyrillic, skeleton `amazon` |
| `pаypal.com`         | `pаypal.com` | `xn--pypal-4ve.com`  | danger | 98    | IDN, 1 homoglyph, Latin + Cyrillic, skeleton `paypal`  |
| `gооgle.com`         | `gооgle.com` | `xn--ggle-55da.com`  | danger | 100   | IDN, 2 homoglyphs, Latin + Cyrillic, skeleton `google` |
| `аррӏе.com`          | `аррӏе.com`  | `xn--80ak6aa92e.com` | danger | 75    | IDN, 4 homoglyphs, high non-ASCII density              |
| `exa\u202emple.com`  | (invalid)    | (invalid)            | danger | 70    | IDNA validation failure, bidi control character        |
| `münchen.de`         | `münchen.de` | `xn--mnchen-3ya.de`  | watch  | 25    | IDN only: a real German word, no lookalikes            |
| `ｇｏｏｇｌｅ.com`   | `google.com` | `google.com`         | safe   | 0     | IDNA maps fullwidth to ASCII: it really is google.com  |

### The first example, point by point

`xn--mzn-5cdb9f.com` is the address from this project's first bug report:

```text
label "xn--mzn-5cdb9f" -> "аmаzоn"
  IDN label                           +25
  3 homoglyphs: min(40, 15 + 8*3)     +39
  Latin + Cyrillic                    +35
  density 3/6 = 50%, but mixed        +0
                                      = 99
label "com"                           +0
skeleton "amazon" is ASCII            +15
total 114, capped                     = 100  -> danger
```

### Reproduce it yourself

The unit tests in [apps/extension/tests/unit/analyze.test.ts](../../../apps/extension/tests/unit/analyze.test.ts) exercise these paths. To print the output for your own inputs, bundle the engine and call it from Node:

```bash
pnpm dlx esbuild@0.25.12 packages/core/src/index.ts --bundle --platform=node --format=esm --outfile=/tmp/core.mjs
node -e 'import("/tmp/core.mjs").then(c => console.log(c.analyzeHostname("xn--mzn-5cdb9f.com")))'
# { level: 'danger', score: 100, unicodeHostname: 'аmаzоn.com', skeleton: 'amazon', ... }
```

---

Previous: [5.1 Architecture](01-architecture.md) · Next: [5.3 Character inspector](03-character-inspector.md)
