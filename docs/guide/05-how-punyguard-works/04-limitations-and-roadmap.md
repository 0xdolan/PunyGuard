# 5.4 Limitations and roadmap

No detector is complete. This page lists what PunyGuard does not catch today, each with a concrete example taken from the engine's real output, so you know where to stay careful and where contributions would help most.

## Detection gaps

### 1. Some invisible characters are not flagged in the inspector

The inspector's **Invisible** flag uses categories plus a fixed list ([5.3](03-character-inspector.md)). Characters that are invisible but categorized as letters, symbols, or private use are missed:

| Code point                     | Category | Flagged invisible?              |
| ------------------------------ | -------- | ------------------------------- |
| U+3164 HANGUL FILLER           | `Lo`     | no (and shown without its name) |
| U+FFA0 HALFWIDTH HANGUL FILLER | `Lo`     | no                              |
| U+2800 BRAILLE PATTERN BLANK   | `So`     | no                              |
| U+E000 (Private Use Area)      | `Co`     | no                              |
| U+FE0F VARIATION SELECTOR-16   | `Mn`     | no                              |

For **domains** the impact is limited: IDNA either drops these characters (U+3164) or rejects the hostname (PUA), so the browser never connects to a name containing them. The gap matters when you use the inspector to examine arbitrary text.

**Fix:** use Unicode's `Default_Ignorable_Code_Point` property (which covers the fillers, variation selectors, and tags; [2.1](../02-tricky-unicode/01-invisible-characters.md)) plus explicit checks for `Co` and U+2800.

### 2. The confusables table is small

The table has 153 entries; Unicode's `confusables.txt` has thousands. For example, Cyrillic `ӏ` (U+04CF PALOCHKA), which looks like `l`, is missing:

```text
аррӏе.com  ->  skeleton "appӏe"  (not "apple")
```

The domain is still rated **danger** (score 75, from the IDN, homoglyph, and density signals), but it misses the `ASCII skeleton` bonus and the clearer explanation.

The table's mathematical-letter range is also misaligned: it starts at U+1D5C4 (MATHEMATICAL SANS-SERIF SMALL K) instead of the start of an alphabet, so styled letters such as `𝗮` are not recognized as homoglyphs. Domains are unaffected (IDNA maps these to ASCII first); the inspector's **Homoglyph** flag is.

**Fix:** generate the table at build time from `confusables.txt`.

### 3. No comparison against known brands

The engine notices that `pаypal` has the skeleton `paypal`, but it does not know that `paypal.com` is a popular site. It cannot say "this looks like paypal.com", and it cannot catch a whole-script lookalike of a brand when no other signal fires.

**Fix:** ship a list of popular registrable domains and their skeletons, and flag any other domain with the same skeleton.

### 4. Legitimate mixed scripts are flagged

Japanese routinely mixes Han, Hiragana, and Katakana:

```text
例え.jp  ->  danger, score 60: "Mixed scripts: Han + Hiragana"
```

This is a false positive.

**Fix:** treat UTS #39 augmented script sets (Japanese, Korean, Chinese) as single scripts ([2.3](../02-tricky-unicode/03-confusables-and-scripts.md)).

### 5. Small public suffix list

Only common multi-part suffixes are built in, and the skeleton for a multi-part suffix picks the wrong label:

```text
аpple.co.uk  ->  danger, score 83, but skeleton "co" instead of "apple"
```

The level is still right, but the `ASCII skeleton: "apple"` reason and its 15 points are lost.

**Fix:** use the label identified as the SLD for the skeleton, and adopt the full Public Suffix List.

### 6. Pure ASCII tricks are out of scope

`paypa1.com`, `rnicrosoft.com`, and `paypal.com.secure-login.example` contain no Unicode, so they score **safe**. These are typosquatting and structure tricks ([3.1](../03-domains/01-domain-names.md)); catching them needs a brand list and edit-distance checks.

### 7. Script detection is approximate

Scripts are assigned by code point ranges for 12 families; everything else counts as "Other" and does not contribute to mixed-script detection.

### 8. What the content script cannot see

Hostnames are collected from DOM attributes and the first 250,000 characters of the HTML. Not covered: text inside images or canvas, closed shadow DOM, links built only when clicked, and anything past the HTML sample.

## Roadmap

Ordered by value for effort:

1. Flag `Default_Ignorable_Code_Point`, Private Use, and U+2800 as invisible in the inspector, and add names for the Hangul fillers.
2. Fix the skeleton label for multi-part suffixes and the mathematical-letter offset.
3. Generate the confusables table from `confusables.txt`.
4. Treat augmented script sets as single scripts.
5. Compare skeletons against a popular-domain list.
6. Adopt the Public Suffix List.

Contributions are welcome; see [CONTRIBUTING.md](../../../CONTRIBUTING.md).

---

Previous: [5.3 Character inspector](03-character-inspector.md) · Next: [Glossary](../glossary.md)
