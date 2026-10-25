# 1.4 Encoding and decoding

A code point is an abstract number. To store or send it, you need an **encoding**: a rule for turning code points into bytes.

- **Encoding**: text (code points) to bytes. `"é".encode("utf-8")` gives `b'\xc3\xa9'`.
- **Decoding**: bytes to text. `b'\xc3\xa9'.decode("utf-8")` gives `'é'`.

Bytes on their own do not say which encoding produced them. Decoding with the wrong one does not fail loudly; it produces the wrong text. That is the root of most text bugs, and of some security bugs.

## UTF-8

UTF-8 is the encoding of the web, of Linux, and of almost every modern file format. It uses 1 to 4 bytes per code point:

| Code point range | Bytes | Bit pattern                           |
| ---------------- | ----- | ------------------------------------- |
| U+0000-U+007F    | 1     | `0xxxxxxx`                            |
| U+0080-U+07FF    | 2     | `110xxxxx 10xxxxxx`                   |
| U+0800-U+FFFF    | 3     | `1110xxxx 10xxxxxx 10xxxxxx`          |
| U+10000-U+10FFFF | 4     | `11110xxx 10xxxxxx 10xxxxxx 10xxxxxx` |

The `x` bits hold the code point's bits, filled from the left.

### Worked example: `é` (U+00E9)

```text
U+00E9 = 233 = 000 1110 1001   (11 bits, so the 2-byte form)
2-byte template:   110xxxxx      10xxxxxx
fill in bits:      110 00011     10 101001
result:            1100 0011     1010 1001  = C3 A9
```

### Worked example: HANGUL FILLER (U+3164)

```text
U+3164 = 0011 0001 0110 0100   (16 bits, so the 3-byte form)
3-byte template:  1110xxxx  10xxxxxx  10xxxxxx
fill in bits:     1110 0011 10 000101 10 100100
result:           E3        85        A4
```

So a single blank-looking character is three bytes on disk: `E3 85 A4`. You can confirm with:

```bash
printf '\u3164' | xxd      # 00000000: e385 a4
```

### Why UTF-8 is designed this way

- **ASCII is unchanged.** A pure ASCII file is already valid UTF-8.
- **No ASCII byte appears inside a multi-byte character.** Every byte of a multi-byte sequence is `0x80` or higher, so searching for `/` or `"` never matches half of another character.
- **Self-synchronizing.** Continuation bytes always start with `10`, so a reader can find the start of the next character from any position.

## UTF-16

UTF-16 uses 16-bit code units. Code points in the BMP take one unit; everything above U+FFFF takes two, called a **surrogate pair** (from the reserved range U+D800-U+DFFF):

```text
U+1F600 (😀)
subtract 0x10000         -> 0x0F600
high 10 bits + 0xD800    -> 0xD83D
low 10 bits  + 0xDC00    -> 0xDE00
UTF-16 (big-endian bytes): D8 3D DE 00
```

JavaScript, Java, C#, and Windows store strings in UTF-16. That is why in JavaScript:

```js
'😀'.length; // 2   (two UTF-16 code units)
[...'😀'].length; // 1   (one code point)
'😀'.charCodeAt(0).toString(16); // 'd83d' (half of a surrogate pair)
'😀'.codePointAt(0).toString(16); // '1f600'
```

## UTF-32

UTF-32 stores every code point in exactly 4 bytes. It is simple (string index equals code point index) but wasteful, so it is mostly used inside programs, not in files.

## Comparison

| Text                            | Code points | UTF-8 bytes   | UTF-16 units | UTF-16BE bytes |
| ------------------------------- | ----------- | ------------- | ------------ | -------------- |
| `A`                             | 1           | `41`          | 1            | `00 41`        |
| `é`                             | 1           | `C3 A9`       | 1            | `00 E9`        |
| `€`                             | 1           | `E2 82 AC`    | 1            | `20 AC`        |
| `😀`                            | 1           | `F0 9F 98 80` | 2            | `D8 3D DE 00`  |
| family emoji (3 people + 2 ZWJ) | 5           | 18 bytes      | 8            | 16 bytes       |

## Byte order and the BOM

UTF-16 and UTF-32 units are bigger than a byte, so the byte order matters: `00 41` (big-endian) or `41 00` (little-endian). A file can start with U+FEFF, the **byte order mark** (BOM), to say which:

| Bytes at file start | Meaning                                      |
| ------------------- | -------------------------------------------- |
| `EF BB BF`          | UTF-8 (BOM is optional and usually unwanted) |
| `FE FF`             | UTF-16 big-endian                            |
| `FF FE`             | UTF-16 little-endian                         |

U+FEFF anywhere other than the very start of a file is a zero-width character, and scanners should flag it.

## When decoding goes wrong

**Mojibake** is text decoded with the wrong encoding:

```python
"café".encode("utf-8")            # b'caf\xc3\xa9'
b"caf\xc3\xa9".decode("cp1252")   # 'cafÃ©'   UTF-8 bytes read as Windows-1252
```

**Invalid bytes.** A byte sequence that is not valid UTF-8 either raises an error or is replaced with U+FFFD (`�`), depending on the decoder's error mode:

```python
b"caf\xe9".decode("utf-8")
# UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 3
b"caf\xe9".decode("utf-8", errors="replace")   # 'caf�'
```

Security relevance: if two components decode the same bytes differently (one strict, one lenient, or one UTF-8 and one Latin-1), they can disagree about what a string says. Validate input as strict UTF-8 at the boundary, then work with code points.

## Encoding is not encryption

Base64, hex, URL encoding, and Punycode are all reversible representations, not secrets:

```python
import base64
base64.b64encode("Hi".encode()).decode()   # 'SGk='
base64.b64decode("SGk=").decode()          # 'Hi'
```

The invisible-character trick in [4.1](../04-invisible-code/01-hiding-data-in-invisible-characters.md) is the same idea: an encoding that happens to be hard for humans to see.

## Try it

```bash
printf 'é' | xxd            # c3a9: UTF-8
printf 'é' | iconv -t UTF-16BE | xxd   # 00e9
python3 -c "print('😀'.encode('utf-8').hex(' '))"   # f0 9f 98 80
```

---

Previous: [1.3 Unicode](03-unicode.md) · Next: [1.5 Escapes and representations](05-escapes-and-representations.md)
