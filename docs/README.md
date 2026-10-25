# PunyGuard documentation

This folder is a self-contained course on text encoding and Unicode security, followed by a tour of how PunyGuard applies those ideas. Read it in order if you are new to the topic, or jump to a section.

Every example on these pages was run and its output pasted in. The scripts in [examples/](examples/) are runnable and use only the standard library.

## Learning path

### 1. Foundations: how computers store text

| #   | Guide                                                                                 | You will learn                                                                    |
| --- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1.1 | [Bits, bytes, and number bases](guide/01-foundations/01-bits-bytes-and-numbers.md)    | Binary, hexadecimal, and decimal, and how to convert between them                 |
| 1.2 | [ASCII](guide/01-foundations/02-ascii.md)                                             | The 128-character table everything else builds on                                 |
| 1.3 | [Unicode](guide/01-foundations/03-unicode.md)                                         | Code points, `U+` notation, planes, blocks, categories, and scripts               |
| 1.4 | [Encoding and decoding](guide/01-foundations/04-encoding-and-decoding.md)             | UTF-8, UTF-16, UTF-32, byte order marks, and mojibake                             |
| 1.5 | [Escapes and representations](guide/01-foundations/05-escapes-and-representations.md) | HTML, URL, JavaScript, Python, JSON, and CSS escapes; why string length is tricky |

### 2. The tricky parts of Unicode

| #   | Guide                                                                                  | You will learn                                                                     |
| --- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 2.1 | [Invisible and special characters](guide/02-tricky-unicode/01-invisible-characters.md) | Zero-width characters, Hangul fillers, the Private Use Area, tags, fullwidth forms |
| 2.2 | [Normalization](guide/02-tricky-unicode/02-normalization.md)                           | NFC, NFD, NFKC, NFKD, and case folding                                             |
| 2.3 | [Confusables and scripts](guide/02-tricky-unicode/03-confusables-and-scripts.md)       | Homoglyphs, skeletons, and mixed-script detection (UTS #39)                        |
| 2.4 | [Bidirectional text](guide/02-tricky-unicode/04-bidirectional-text.md)                 | Right-to-left controls and the Trojan Source attack                                |

### 3. Domain names

| #   | Guide                                                         | You will learn                                                       |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| 3.1 | [How domain names work](guide/03-domains/01-domain-names.md)  | Labels, TLDs, registrable domains, and the public suffix problem     |
| 3.2 | [IDN and Punycode](guide/03-domains/02-idn-and-punycode.md)   | How `münchen.de` becomes `xn--mnchen-3ya.de`, step by step           |
| 3.3 | [Homograph attacks](guide/03-domains/03-homograph-attacks.md) | Lookalike domains, how browsers respond, and how to protect yourself |

### 4. Invisible code

| #   | Guide                                                                                                    | You will learn                                                             |
| --- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 4.1 | [Hiding data in invisible characters](guide/04-invisible-code/01-hiding-data-in-invisible-characters.md) | The Hangul-filler bit encoding, line by line, and its bugs                 |
| 4.2 | [Attacks in source code and config](guide/04-invisible-code/02-attacks-in-source-and-config.md)          | Invisible identifiers, hidden payloads, Trojan Source, YAML and CI risks   |
| 4.3 | [Detection and defense](guide/04-invisible-code/03-detection-and-defense.md)                             | Scanners, grep recipes, git hooks, CI, editors, and what common tools miss |

### 5. How PunyGuard works

| #   | Guide                                                                                     | You will learn                                                     |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 5.1 | [Architecture](guide/05-how-punyguard-works/01-architecture.md)                           | The extension's parts and how a page scan flows through them       |
| 5.2 | [Domain detection pipeline](guide/05-how-punyguard-works/02-domain-detection-pipeline.md) | Every step from a raw hostname to a score, with real engine output |
| 5.3 | [Character inspector](guide/05-how-punyguard-works/03-character-inspector.md)             | What each field in the inspector means and how it is computed      |
| 5.4 | [Limitations and roadmap](guide/05-how-punyguard-works/04-limitations-and-roadmap.md)     | What the engine misses today, with examples                        |

### Reference

- [Glossary](guide/glossary.md): every term used in the guide, in one place.
- [Runnable examples](examples/README.md): the invisible-text codec, a Unicode scanner, and a git pre-commit hook.

## For maintainers

- [Releasing](RELEASING.md): versions, changelog, tags, release packages, and GitHub setup.
