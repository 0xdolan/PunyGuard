/**
 * Curated homoglyph / confusable matrix compiled for local lookup.
 * Inspired by Unicode UTS #39 (Unicode Security Mechanisms).
 */

function buildConfusableMap(): Map<number, string> {
  const entries: Array<[number, string]> = [
    // Cyrillic → Latin
    [0x0430, 'a'],
    [0x0410, 'A'],
    [0x0435, 'e'],
    [0x0415, 'E'],
    [0x043e, 'o'],
    [0x041e, 'O'],
    [0x0440, 'p'],
    [0x0420, 'P'],
    [0x0441, 'c'],
    [0x0421, 'C'],
    [0x0443, 'y'],
    [0x0445, 'x'],
    [0x0425, 'X'],
    [0x0456, 'i'],
    [0x0406, 'I'],
    [0x0457, 'i'],
    [0x04bb, 'h'],
    [0x0501, 'd'],
    [0x051b, 'q'],
    [0x051d, 'w'],
    [0x0432, 'b'],
    [0x0412, 'B'],
    [0x043a, 'k'],
    [0x041a, 'K'],
    [0x043c, 'm'],
    [0x041c, 'M'],
    [0x043d, 'h'],
    [0x041d, 'H'],
    [0x0442, 't'],
    [0x0422, 'T'],
    [0x0437, '3'],
    [0x04e9, 'o'],

    // Greek → Latin
    [0x03b1, 'a'],
    [0x0391, 'A'],
    [0x03b2, 'b'],
    [0x0392, 'B'],
    [0x03b5, 'e'],
    [0x0395, 'E'],
    [0x03b9, 'i'],
    [0x0399, 'I'],
    [0x03ba, 'k'],
    [0x039a, 'K'],
    [0x03bf, 'o'],
    [0x039f, 'O'],
    [0x03c1, 'p'],
    [0x03a1, 'P'],
    [0x03c4, 't'],
    [0x03a4, 'T'],
    [0x03c5, 'u'],
    [0x03a5, 'Y'],
    [0x03c7, 'x'],
    [0x03a7, 'X'],
    [0x03bd, 'v'],
    [0x039d, 'N'],
    [0x0397, 'H'],
    [0x039c, 'M'],

    // Misc lookalikes
    [0x00f0, 'd'],
    [0x01a1, 'o'],
    [0x0261, 'g'],
    [0x0131, 'i'],
    [0x0237, 'j'],
    [0x0578, 'n'],
    [0x0570, 'h'],
    [0x0584, 'q'],
    [0x0566, 'q'],
  ];

  for (let i = 0; i < 26; i++) {
    entries.push([0xff21 + i, String.fromCharCode(65 + i)]);
    entries.push([0xff41 + i, String.fromCharCode(97 + i)]);
  }
  for (let i = 0; i < 10; i++) {
    entries.push([0xff10 + i, String.fromCharCode(48 + i)]);
  }
  for (let i = 0; i < 26; i++) {
    entries.push([0x1d5c4 + i, String.fromCharCode(97 + i)]);
  }

  return new Map(entries);
}

export const CONFUSABLE_TO_LATIN: ReadonlyMap<number, string> = buildConfusableMap();

/** Bit flags for Unicode script families used in mixed-script detection. */
export const enum ScriptBit {
  Latin = 1 << 0,
  Cyrillic = 1 << 1,
  Greek = 1 << 2,
  Arabic = 1 << 3,
  Hebrew = 1 << 4,
  Han = 1 << 5,
  Hangul = 1 << 6,
  Hiragana = 1 << 7,
  Katakana = 1 << 8,
  Thai = 1 << 9,
  Devanagari = 1 << 10,
  Armenian = 1 << 11,
  Other = 1 << 12,
}

export function scriptBitForCodePoint(cp: number): ScriptBit | 0 {
  if ((cp >= 0x0041 && cp <= 0x005a) || (cp >= 0x0061 && cp <= 0x007a)) return ScriptBit.Latin;
  if (cp >= 0x00c0 && cp <= 0x024f) return ScriptBit.Latin;
  if (cp >= 0x0400 && cp <= 0x04ff) return ScriptBit.Cyrillic;
  if (cp >= 0x0500 && cp <= 0x052f) return ScriptBit.Cyrillic;
  if (cp >= 0x0370 && cp <= 0x03ff) return ScriptBit.Greek;
  if (cp >= 0x1f00 && cp <= 0x1fff) return ScriptBit.Greek;
  if (cp >= 0x0600 && cp <= 0x06ff) return ScriptBit.Arabic;
  if (cp >= 0x0590 && cp <= 0x05ff) return ScriptBit.Hebrew;
  if (cp >= 0x4e00 && cp <= 0x9fff) return ScriptBit.Han;
  if (cp >= 0xac00 && cp <= 0xd7af) return ScriptBit.Hangul;
  if (cp >= 0x3040 && cp <= 0x309f) return ScriptBit.Hiragana;
  if (cp >= 0x30a0 && cp <= 0x30ff) return ScriptBit.Katakana;
  if (cp >= 0x0e00 && cp <= 0x0e7f) return ScriptBit.Thai;
  if (cp >= 0x0900 && cp <= 0x097f) return ScriptBit.Devanagari;
  if (cp >= 0x0530 && cp <= 0x058f) return ScriptBit.Armenian;
  if (cp > 0x007f) return ScriptBit.Other;
  return 0;
}

export function popcount(n: number): number {
  let c = 0;
  while (n) {
    n &= n - 1;
    c++;
  }
  return c;
}
