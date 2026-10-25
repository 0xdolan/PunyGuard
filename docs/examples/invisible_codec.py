#!/usr/bin/env python3
"""Hide text inside invisible Unicode characters, then recover it.

Educational demo for docs/guide/04-invisible-code/01-hiding-data-in-invisible-characters.md.
It only prints strings; it never executes what it decodes.

    python3 docs/examples/invisible_codec.py "Hello"
"""

import sys
import unicodedata

# Two code points that render as blank space in most editors and fonts.
# They are letters (category Lo), not whitespace, which is why they slip
# through checks that only look for spaces, tabs, or "control" characters.
BIT_0 = "\u3164"  # HANGUL FILLER
BIT_1 = "\uFFA0"  # HALFWIDTH HANGUL FILLER


def text_to_invisible(text: str) -> str:
    """Text -> UTF-8 bytes -> bits -> invisible characters.

    Encoding to UTF-8 first makes every unit exactly one byte (0-255), so
    eight bits per unit is always enough. Using ord(c) directly only works
    for code points below 256: ord("€") is 8364, which needs 14 bits.
    """
    bits = "".join(f"{byte:08b}" for byte in text.encode("utf-8"))
    return "".join(BIT_1 if b == "1" else BIT_0 for b in bits)


def invisible_to_text(invisible: str) -> str:
    """Invisible characters -> bits -> bytes -> UTF-8 text."""
    bits = "".join("1" if c == BIT_1 else "0" for c in invisible if c in (BIT_0, BIT_1))
    data = bytes(int(bits[i : i + 8], 2) for i in range(0, len(bits) - 7, 8))
    return data.decode("utf-8")


def reveal(s: str) -> str:
    """Show every non-ASCII code point as <U+XXXX NAME> so nothing hides."""
    out = []
    for c in s:
        if 0x20 <= ord(c) < 0x7F:
            out.append(c)
        else:
            out.append(f"<U+{ord(c):04X} {unicodedata.name(c, 'UNNAMED')}>")
    return "".join(out)


if __name__ == "__main__":
    message = sys.argv[1] if len(sys.argv) > 1 else 'print("hidden")'
    hidden = text_to_invisible(message)

    print(f"message:          {message!r}")
    print(f"looks like:       [{hidden}]")
    print(f"code points:      {len(hidden)} ({len(message.encode('utf-8'))} bytes x 8 bits)")
    print(f"first 2 revealed: {reveal(hidden[:2])}")
    print(f"decoded:          {invisible_to_text(hidden)!r}")
    assert invisible_to_text(hidden) == message
