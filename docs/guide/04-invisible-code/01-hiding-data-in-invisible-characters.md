# 4.1 Hiding data in invisible characters

> Educational content. This page shows how text can be hidden in characters that render as nothing, so that you can recognize and detect it. The examples only print strings. No malware, network access, or persistence technique is shown.

Unicode lets a file contain characters that are visually indistinguishable from empty space ([2.1](../02-tricky-unicode/01-invisible-characters.md)). Two such characters are enough to represent binary, and binary can represent anything. This page builds that encoder and decoder step by step.

## The mental model

```text
Text                    "Ab"
  ↓  ord / encode       65, 98
Numbers
  ↓  format as 8 bits   01000001 01100010
Binary
  ↓  map 0 and 1        16 invisible characters
Invisible Unicode
  ↓  map back           01000001 01100010
Binary
  ↓  int(bits, 2)       65, 98
Numbers
  ↓  chr / decode       "Ab"
Text
```

The data never disappears. It only changes representation, from something eyes can read to something only software can read.

## Step 1: choose two invisible "bits"

```python
BIT_0 = "\u3164"  # U+3164 HANGUL FILLER
BIT_1 = "\uffa0"  # U+FFA0 HALFWIDTH HANGUL FILLER
```

| Bit | Character | Name                    | UTF-8      |
| --- | --------- | ----------------------- | ---------- |
| 0   | `\u3164`  | HANGUL FILLER           | `E3 85 A4` |
| 1   | `\uffa0`  | HALFWIDTH HANGUL FILLER | `EF BE A0` |

Why these two:

- They are **distinct code points**, so a program can tell them apart.
- They **render as blank** in most editors, terminals, and web pages.
- They are **not whitespace** and **not control characters** (category `Lo`, letter), so many "strip whitespace" or "remove control characters" filters leave them alone.
- They are even valid in identifiers ([4.2](02-attacks-in-source-and-config.md)).

The mapping itself is arbitrary. Any two invisible code points would do: zero-width space and zero-width non-joiner are another common pair.

## Step 2: text to binary

The original version of this technique, as it usually circulates:

```python
def text_to_invisible(text: str) -> str:
    bits = "".join(f"{ord(c):08b}" for c in text)
    return "".join(BIT_1 if b == "1" else BIT_0 for b in bits)
```

Line by line:

| Code            | What it does                                                                    | For `c = "A"`   |
| --------------- | ------------------------------------------------------------------------------- | --------------- |
| `for c in text` | Loop over each character                                                        | `"A"`           |
| `ord(c)`        | Character to code point ([1.1](../01-foundations/01-bits-bytes-and-numbers.md)) | `65`            |
| `f"{...:08b}"`  | Format as binary, zero-padded to 8 digits                                       | `"01000001"`    |
| `"".join(...)`  | Concatenate into one long bit string                                            | `"01000001..."` |

The padding matters ([1.1](../01-foundations/01-bits-bytes-and-numbers.md)):

```python
format(65, "b")    # '1000001'    7 digits: the decoder could not find byte boundaries
format(65, "8b")   # ' 1000001'   padded with a space: not a valid bit
format(65, "08b")  # '01000001'   exactly 8 digits
```

## Step 3: binary to invisible characters

```python
return "".join(BIT_1 if b == "1" else BIT_0 for b in bits)
```

The same thing written as a loop:

```python
result = []
for b in bits:
    if b == "1":
        result.append(BIT_1)
    else:
        result.append(BIT_0)
return "".join(result)
```

Every `"1"` becomes U+FFA0 and every `"0"` becomes U+3164. The result looks empty but contains 8 characters per input character.

## Step 4: decode

```python
def invisible_to_text(invisible: str) -> str:
    bits = "".join(
        "1" if c == BIT_1 else "0"
        for c in invisible
        if c in (BIT_0, BIT_1)       # ignore anything else
    )
    chars = [chr(int(bits[i:i + 8], 2)) for i in range(0, len(bits), 8)]
    return "".join(chars)
```

| Code                         | What it does                         | Example                |
| ---------------------------- | ------------------------------------ | ---------------------- |
| `if c in (BIT_0, BIT_1)`     | Skip any character that is not a bit | ignores quotes, spaces |
| `"1" if c == BIT_1 else "0"` | Map each character back to a bit     | U+FFA0 to `"1"`        |
| `range(0, len(bits), 8)`     | Step through the bits 8 at a time    | `0, 8, 16, ...`        |
| `bits[i:i + 8]`              | One byte's worth of bits             | `"01000001"`           |
| `int(..., 2)`                | Parse as a base-2 number             | `65`                   |
| `chr(...)`                   | Number to character                  | `"A"`                  |

```text
bits = 01000001 01100010
        ↓        ↓
        65       98
        ↓        ↓
       'A'      'b'
```

## The bug: characters above 255

The original encoder assumes every character fits in 8 bits. That is only true for code points 0-255. Anything else silently corrupts:

```python
f"{ord('é'):08b}"   # '11101001'        8 bits: works by luck (é is U+00E9 = 233)
f"{ord('€'):08b}"   # '10000010101100'  14 bits: the decoder cuts it into the wrong bytes
f"{ord('ж'):08b}"   # '10000110110'     11 bits
```

| Input                  | Round-trips with the original code? |
| ---------------------- | ----------------------------------- |
| `'alert("invisible")'` | yes                                 |
| `'é'`                  | yes (code point below 256)          |
| `'ж'`                  | no, decodes to `'\x86\x06'`         |
| `'€'`                  | no, decodes to `'\x82,'`            |
| `'😀'`                 | no                                  |

**The fix** is to encode to UTF-8 bytes first ([1.4](../01-foundations/04-encoding-and-decoding.md)). Every byte is 0-255, so 8 bits per unit is always correct:

```python
def text_to_invisible(text: str) -> str:
    bits = "".join(f"{byte:08b}" for byte in text.encode("utf-8"))
    return "".join(BIT_1 if b == "1" else BIT_0 for b in bits)

def invisible_to_text(invisible: str) -> str:
    bits = "".join("1" if c == BIT_1 else "0" for c in invisible if c in (BIT_0, BIT_1))
    data = bytes(int(bits[i:i + 8], 2) for i in range(0, len(bits) - 7, 8))
    return data.decode("utf-8")
```

The complete, runnable version is [docs/examples/invisible_codec.py](../../examples/invisible_codec.py):

```text
$ python3 docs/examples/invisible_codec.py "Hello"
message:          'Hello'
looks like:       [<40 blank characters>]
code points:      40 (5 bytes x 8 bits)
first 2 revealed: <U+3164 HANGUL FILLER><U+FFA0 HALFWIDTH HANGUL FILLER>
decoded:          'Hello'
```

## Full round trip

```python
text = 'alert("invisible")'
encoded = text_to_invisible(text)   # looks blank, 144 code points
decoded = invisible_to_text(encoded)
decoded == text                     # True
```

## The cost: it is big

Hiding is not free. For `print("Hello")` (14 bytes):

| Representation                | Size                               |
| ----------------------------- | ---------------------------------- |
| Original text                 | 14 bytes                           |
| Invisible characters          | 112 code points (14 x 8)           |
| Invisible characters in UTF-8 | 336 bytes (each filler is 3 bytes) |

That 24x growth is a detection signal: a source file or config value that is mostly "empty" but hundreds of bytes long deserves a look. The same signal shows up as a long line that seems to end early, or a string literal whose quotes seem to be next to each other.

## Other ways to do the same thing

The two-filler scheme is one of many. All of them are **representation tricks**, and all are detected by the same method: look at code points, not at glyphs.

| Carrier                                | Bits per character | Notes                                                                           |
| -------------------------------------- | ------------------ | ------------------------------------------------------------------------------- |
| Two invisible characters (this page)   | 1                  | Hangul fillers, or U+200B / U+200C                                              |
| Four invisible characters              | 2                  | U+200B, U+200C, U+200D, U+2060                                                  |
| Tag characters U+E0020-U+E007E         | 7 (one ASCII char) | Directly mirrors ASCII ([2.1](../02-tricky-unicode/01-invisible-characters.md)) |
| Variation selectors (256 of them)      | 8 (one byte)       | Can trail a single visible emoji                                                |
| Private Use Area, `chr(0xE000 + byte)` | 8 (one byte)       | Renders as boxes or nothing, depending on font                                  |
| Trailing spaces and tabs at line ends  | 1                  | Classic whitespace steganography, pure ASCII                                    |

## Why this matters

- **Code review relies on eyesight.** An invisible payload has no keywords, no suspicious imports, and no visible logic.
- **Many tools trust text.** Linters, diff viewers, and log pipelines often pass these characters through untouched.
- **The loader is tiny.** The visible part of a malicious file only needs a decode step and a call that runs the result (`exec`, `eval`, `Function`, a shell). That small loader, not the payload, is what defenders can see and grep for ([4.3](03-detection-and-defense.md)).

> If you can't see it, you can't review it. Security starts with visibility.

## Try it

1. Run `python3 docs/examples/invisible_codec.py "€"` and confirm it round-trips. Then change the encoder back to `ord(c)` and watch it fail.
2. Encode a word, paste the result into your editor, and see whether the editor highlights it.
3. Run `python3 docs/examples/unicode_scan.py` on a file containing the output.

---

Previous: [3.3 Homograph attacks](../03-domains/03-homograph-attacks.md) · Next: [4.2 Attacks in source code and config](02-attacks-in-source-and-config.md)
