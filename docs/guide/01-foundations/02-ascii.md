# 1.2 ASCII

ASCII (American Standard Code for Information Interchange, 1963) assigns a number from 0 to 127 to each of 128 characters. It fits in 7 bits, and every modern encoding, Unicode included, keeps these first 128 numbers unchanged. If you understand ASCII, you already understand the first 128 Unicode code points.

## The layout

| Range (hex) | Range (dec) | Contents                                                  |
| ----------- | ----------- | --------------------------------------------------------- |
| 00-1F       | 0-31        | Control characters (tab, line feed, carriage return, ...) |
| 20          | 32          | Space                                                     |
| 21-2F       | 33-47       | Punctuation `! " # $ % & ' ( ) * + , - . /`               |
| 30-39       | 48-57       | Digits `0`-`9`                                            |
| 3A-40       | 58-64       | `: ; < = > ? @`                                           |
| 41-5A       | 65-90       | Uppercase `A`-`Z`                                         |
| 5B-60       | 91-96       | `[ \ ] ^ _ backtick`                                      |
| 61-7A       | 97-122      | Lowercase `a`-`z`                                         |
| 7B-7E       | 123-126     | `{ \| } ~`                                                |
| 7F          | 127         | DEL (control)                                             |

A few you will see often:

| Char      | Dec | Hex | Binary     | Notes                                       |
| --------- | --- | --- | ---------- | ------------------------------------------- |
| tab       | 9   | 09  | `00001001` | `\t`                                        |
| line feed | 10  | 0A  | `00001010` | `\n`, the Unix line ending                  |
| CR        | 13  | 0D  | `00001101` | `\r`, Windows line endings are `\r\n`       |
| space     | 32  | 20  | `00100000` | the only "blank" printable ASCII character  |
| `-`       | 45  | 2D  | `00101101` | the only punctuation allowed in a DNS label |
| `0`       | 48  | 30  | `00110000` |                                             |
| `A`       | 65  | 41  | `01000001` |                                             |
| `a`       | 97  | 61  | `01100001` |                                             |

## Patterns worth knowing

**Case is one bit.** Uppercase and lowercase letters differ only in the bit worth 32 (`0x20`):

```text
A = 0x41 = 0100 0001
a = 0x61 = 0110 0001
              ^ bit 5
```

```python
chr(ord("A") | 0x20)   # 'a'  set the bit
chr(ord("a") & ~0x20)  # 'A'  clear the bit
```

**Digits are offset by 48.** `ord("7") - ord("0")` is 7, which is how parsers turn the character `7` into the number 7.

**ASCII never has its top bit set.** Every ASCII byte is below 128 (`0x80`). UTF-8, covered in [1.4](04-encoding-and-decoding.md), relies on this: any byte at or above `0x80` is part of a non-ASCII character. That gives you the simplest possible "is this pure ASCII?" test:

```python
"paypal.com".isascii()  # True
"pаypal.com".isascii()  # False: the second letter is Cyrillic U+0430
```

```bash
# Print lines that contain any non-ASCII byte
LC_ALL=C grep -nP '[^\x00-\x7F]' file.txt
```

## Why ASCII matters for security

Domain names were ASCII-only for decades: letters, digits, and hyphen (the "LDH" rule). The only characters that could look alike were pairs like `l`/`1`/`I` and `O`/`0`, which is why classic typosquatting relies on them (`paypa1.com`).

When Unicode was allowed in domain names, thousands of new lookalikes became possible, and that is the problem PunyGuard addresses. ASCII is still the safe baseline: a hostname that is pure ASCII cannot contain a Cyrillic `а` or an invisible character, so it can only be spoofed by those classic tricks.

## Try it

1. What is `chr(0x41 + 25)`? (`Z`)
2. Is the hyphen in `xn--mnchen-3ya` ASCII? (Yes, `0x2D`. Punycode output is always pure ASCII.)
3. Run `LC_ALL=C grep -nP '[^\x00-\x7F]'` on one of your own source files. Are the matches expected?

---

Previous: [1.1 Bits, bytes, and number bases](01-bits-bytes-and-numbers.md) · Next: [1.3 Unicode](03-unicode.md)
