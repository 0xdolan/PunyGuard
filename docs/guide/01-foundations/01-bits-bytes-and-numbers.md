# 1.1 Bits, bytes, and number bases

Everything a computer stores, text included, is a sequence of numbers. Before talking about characters, you need to be comfortable reading those numbers in the three bases that show up everywhere in this guide: binary, decimal, and hexadecimal.

## Bits and bytes

A **bit** is a single 0 or 1. A **byte** is 8 bits, so one byte can hold 2^8 = 256 different values, from `00000000` (0) to `11111111` (255).

| Bits | Distinct values | Range                                               |
| ---- | --------------- | --------------------------------------------------- |
| 1    | 2               | 0-1                                                 |
| 4    | 16              | 0-15                                                |
| 7    | 128             | 0-127                                               |
| 8    | 256             | 0-255                                               |
| 16   | 65,536          | 0-65535                                             |
| 21   | 2,097,152       | enough for every Unicode code point (max 1,114,111) |

Four bits (half a byte) is called a **nibble**. That matters because one nibble is exactly one hexadecimal digit.

## Three ways to write the same number

The letter `A` is stored as the number 65. Here is 65 in each base:

| Base | Name        | Digits used | 65 written as | Common prefix                |
| ---- | ----------- | ----------- | ------------- | ---------------------------- |
| 2    | binary      | 0 1         | `1000001`     | `0b`                         |
| 10   | decimal     | 0-9         | `65`          | none                         |
| 16   | hexadecimal | 0-9 and A-F | `41`          | `0x`, `U+`, `\x`, `%`, `&#x` |

### Reading binary

Each position is a power of two, counting from the right:

```text
position:  7   6   5   4   3   2   1   0
value:   128  64  32  16   8   4   2   1
bits:      0   1   0   0   0   0   0   1   = 64 + 1 = 65
```

### Reading hexadecimal

Each position is a power of 16. The digits A to F stand for 10 to 15:

```text
0x41 = 4 * 16 + 1 = 65
0xFF = 15 * 16 + 15 = 255
0x3164 = 3*4096 + 1*256 + 6*16 + 4 = 12644
```

Because one hex digit is exactly four bits, converting between hex and binary is a lookup, not arithmetic:

```text
hex:     4    1
binary: 0100 0001   -> 01000001 = 65
```

That is why hex is the standard way to write bytes and code points: two hex digits are always one byte.

## Converting in code

Python:

```python
ord("A")            # 65         character -> number
chr(65)             # 'A'        number -> character
bin(65)             # '0b1000001'
hex(65)             # '0x41'
f"{65:08b}"         # '01000001' 8 binary digits, zero padded
f"{65:04X}"         # '0041'     4 hex digits, uppercase
int("01000001", 2)  # 65         parse binary
int("3164", 16)     # 12644      parse hex
```

JavaScript:

```js
'A'.codePointAt(0); // 65
String.fromCodePoint(65); // 'A'
(65).toString(2).padStart(8, '0'); // '01000001'
(65).toString(16).toUpperCase(); // '41'
parseInt('01000001', 2); // 65
parseInt('3164', 16); // 12644
```

### The padding detail that matters later

`format(65, "b")` gives `1000001`, only 7 digits. Formats such as `08b` pad to a fixed width:

```python
format(65, "b")    # '1000001'    7 digits
format(65, "8b")   # ' 1000001'   padded with a space
format(65, "08b")  # '01000001'   padded with a zero
```

Fixed width is what makes a long run of bits decodable: if every value is exactly 8 bits, a decoder can cut the stream every 8 characters. Section [4.1](../04-invisible-code/01-hiding-data-in-invisible-characters.md) shows what goes wrong when a value needs more than 8 bits.

## Try it

1. Convert `0x7A` to decimal and binary. (Answer: 122, `01111010`, the letter `z`.)
2. What is the largest number that fits in 7 bits? (127, the last ASCII code.)
3. Why do two hex digits always describe exactly one byte?

---

Next: [1.2 ASCII](02-ascii.md) · [Back to the index](../../README.md)
